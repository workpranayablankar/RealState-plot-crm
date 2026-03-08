import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ImportExportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState("");

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return row;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);

      // Map CSV columns to lead fields
      const columnMap: Record<string, string> = {
        name: "name", Name: "name",
        phone: "phone", Phone: "phone",
        email: "email", Email: "email",
        location: "location", Location: "location",
        budget: "budget", Budget: "budget",
        source: "source", Source: "source",
        notes: "notes", Notes: "notes",
      };

      let imported = 0;
      let errors = 0;

      for (const row of rows) {
        const lead: Record<string, string> = {};
        Object.entries(row).forEach(([key, val]) => {
          const mapped = columnMap[key];
          if (mapped) lead[mapped] = val;
        });

        if (!lead.name || !lead.phone) { errors++; continue; }

        const { error } = await supabase.from("leads").insert({
          name: lead.name,
          phone: lead.phone,
          email: lead.email || "",
          location: lead.location || "",
          budget: lead.budget || "",
          source: (lead.source as any) || "Manual",
          notes: lead.notes || "",
        });

        if (error) errors++;
        else imported++;
      }

      toast({
        title: "Import Complete",
        description: `${imported} leads imported, ${errors} skipped`,
      });
      setImporting(false);
      setPreview(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    setExporting(true);
    const { data, error } = await supabase.from("leads").select("name, phone, email, location, budget, source, status, notes, created_at");
    if (error) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
      setExporting(false);
      return;
    }

    const leads = data || [];
    const headers = ["Name", "Phone", "Email", "Location", "Budget", "Source", "Status", "Notes", "Created At"];
    const csvRows = [
      headers.join(","),
      ...leads.map((l) =>
        [l.name, l.phone, l.email, l.location, l.budget, l.source, l.status, l.notes, l.created_at]
          .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: `Exported ${leads.length} leads` });
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Import / Export Data</h2>
        <p className="text-sm text-muted-foreground">Upload or download lead data in CSV format</p>
      </div>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" /> Import Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Upload a CSV file with lead data</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choose CSV File
            </Button>
            {fileName && <p className="text-sm text-foreground mt-2">{fileName}</p>}
          </div>

          <div className="text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Required columns: <strong>Name</strong>, <strong>Phone</strong>. Optional: Email, Location, Budget, Source, Notes</span>
          </div>

          {preview && preview.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Preview (first {preview.length} rows)</p>
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      {Object.keys(preview[0]).map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-2 py-1.5 text-foreground">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={handleImport} disabled={importing} className="mt-3">
                {importing ? "Importing..." : "Import Leads"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Export Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Download all leads as a CSV file for reporting and backup.
          </p>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            {exporting ? "Exporting..." : "Export All Leads"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
