import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParsedLead {
  name: string;
  phone: string;
  email: string;
  location: string;
  address: string;
  budget: string;
  interested_plot: string;
  source: string;
  notes: string;
  valid: boolean;
  error?: string;
}

const SAMPLE_CSV = `Name,Phone,Email,Location,Address,Budget,Interested Plot,Lead Source,Notes
Rahul Sharma,9876543210,rahul@gmail.com,Pune,Kothrud,500000,Plot No 12,Facebook,Interested in corner plot
Amit Patil,9123456780,amit@gmail.com,Nashik,College Road,300000,Plot No 8,Website,Call next week`;

const VALID_SOURCES = ["Website", "Facebook", "Instagram", "Referral", "Direct Call", "Other", "Facebook Ads", "Google Ads", "Manual"];

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else current += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') { cells.push(current.trim()); current = ""; }
        else current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export function ImportLeadsModal({ open, onOpenChange, onImported }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const { role, user } = useAuth();
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsed, setParsed] = useState<ParsedLead[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState({ imported: 0, skipped: 0, errors: 0 });
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep("upload");
    setParsed([]);
    setProgress(0);
    setImportResult({ imported: 0, skipped: 0, errors: 0 });
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast({ title: "Empty CSV", description: "No data rows found", variant: "destructive" });
        return;
      }

      // Map headers
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const colMap = {
        name: headers.findIndex(h => h.includes("name")),
        phone: headers.findIndex(h => h.includes("phone")),
        email: headers.findIndex(h => h.includes("email")),
        location: headers.findIndex(h => h.includes("location")),
        address: headers.findIndex(h => h.includes("address")),
        budget: headers.findIndex(h => h.includes("budget")),
        interested_plot: headers.findIndex(h => h.includes("plot")),
        source: headers.findIndex(h => h.includes("source")),
        notes: headers.findIndex(h => h.includes("note")),
      };

      const leads: ParsedLead[] = rows.slice(1).map(row => {
        const get = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : "");
        const name = get(colMap.name);
        const phone = get(colMap.phone).replace(/[^0-9]/g, "");
        let error: string | undefined;
        let valid = true;
        if (!name) { valid = false; error = "Name required"; }
        else if (!phone) { valid = false; error = "Phone required"; }
        else if (!/^\d+$/.test(phone)) { valid = false; error = "Phone must be numeric"; }

        return {
          name,
          phone,
          email: get(colMap.email),
          location: get(colMap.location),
          address: get(colMap.address),
          budget: get(colMap.budget),
          interested_plot: get(colMap.interested_plot),
          source: get(colMap.source),
          notes: get(colMap.notes),
          valid,
          error,
        };
      }).filter(l => l.name || l.phone); // skip completely empty rows

      setParsed(leads);
      setStep("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    setStep("importing");
    const validLeads = parsed.filter(l => l.valid);

    // Get existing phones to skip duplicates
    const { data: existing } = await supabase.from("leads").select("phone");
    const existingPhones = new Set((existing || []).map(l => l.phone.replace(/[^0-9]/g, "")));

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const batchSize = 20;
    const toImport = validLeads.filter(l => {
      if (existingPhones.has(l.phone)) { skipped++; return false; }
      return true;
    });

    for (let i = 0; i < toImport.length; i += batchSize) {
      const batch = toImport.slice(i, i + batchSize).map(l => {
        const matchedSource = VALID_SOURCES.find(s => s.toLowerCase() === l.source.toLowerCase());
        return {
          name: l.name,
          phone: l.phone,
          email: l.email || null,
          location: l.location || null,
          address: l.address || null,
          budget: l.budget ? (l.budget.startsWith("₹") ? l.budget : `₹${l.budget.replace(/[^0-9]/g, "")}`) : null,
          property_interest: l.interested_plot || "Residential Plot",
          source: (matchedSource || "Manual") as any,
          notes: l.notes || null,
          assigned_agent: role === "agent" ? (user?.id || null) : null,
        };
      });

      const { error } = await supabase.from("leads").insert(batch as any);
      if (error) { errors += batch.length; } else { imported += batch.length; }
      setProgress(Math.round(((i + batch.length) / toImport.length) * 100));
    }

    skipped += parsed.filter(l => !l.valid).length;
    setImportResult({ imported, skipped, errors });
    setStep("done");
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsed.filter(l => l.valid).length;
  const invalidCount = parsed.filter(l => !l.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Import Leads from CSV
          </DialogTitle>
          <DialogDescription>Upload a CSV file to bulk import leads into your CRM.</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Drag & drop your CSV file here, or</p>
              <label>
                <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
                <Button variant="outline" asChild><span>Browse Files</span></Button>
              </label>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={downloadSample} className="text-primary">
                <Download className="h-4 w-4 mr-1" /> Download Sample CSV
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> {validCount} valid</Badge>
              {invalidCount > 0 && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> {invalidCount} invalid</Badge>}
              <span className="text-muted-foreground">Showing first {Math.min(parsed.length, 10)} of {parsed.length} rows</span>
            </div>
            <div className="border rounded-lg overflow-auto max-h-[40vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.slice(0, 10).map((l, i) => (
                    <TableRow key={i} className={!l.valid ? "bg-destructive/5" : ""}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="font-medium">{l.name || "—"}</TableCell>
                      <TableCell>{l.phone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{l.email || "—"}</TableCell>
                      <TableCell>{l.location || "—"}</TableCell>
                      <TableCell>{l.source || "—"}</TableCell>
                      <TableCell>
                        {l.valid
                          ? <Badge variant="secondary" className="text-xs">Valid</Badge>
                          : <Badge variant="destructive" className="text-xs">{l.error}</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Leads
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Importing leads...</p>
            <Progress value={progress} className="w-full" />
            <p className="text-lg font-semibold text-foreground">{progress}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-8 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold text-foreground">Import Complete!</h3>
            <div className="flex justify-center gap-4 text-sm">
              <span className="text-green-600 font-medium">{importResult.imported} imported</span>
              {importResult.skipped > 0 && <span className="text-muted-foreground">{importResult.skipped} skipped</span>}
              {importResult.errors > 0 && <span className="text-destructive">{importResult.errors} errors</span>}
            </div>
            <Button onClick={() => { handleClose(false); onImported(); }}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
