import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Globe, Facebook, BarChart3, MessageCircle, Copy, ExternalLink } from "lucide-react";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
const API_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/capture-lead`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const integrations = [
  {
    id: "website",
    name: "Website Form API",
    description: "Capture leads from your website contact forms by posting data to the API endpoint.",
    icon: Globe,
    status: "active" as const,
  },
  {
    id: "facebook",
    name: "Facebook Lead Ads",
    description: "Connect Facebook Lead Ads via webhook to automatically import leads from ad campaigns.",
    icon: Facebook,
    status: "available" as const,
  },
  {
    id: "google",
    name: "Google Ads",
    description: "Import leads from Google Ads lead form extensions using the same webhook endpoint.",
    icon: BarChart3,
    status: "available" as const,
  },
  {
    id: "whatsapp",
    name: "WhatsApp API",
    description: "Capture leads from WhatsApp Business API conversations automatically.",
    icon: MessageCircle,
    status: "available" as const,
  },
];

const samplePayload = `{
  "name": "Ravi Kumar",
  "phone": "+91 98765 43210",
  "email": "ravi@example.com",
  "source": "Website",
  "location": "Mumbai",
  "budget": "₹50 Lakh",
  "property_interest": "Residential Plot",
  "notes": "Interested in north-facing plot"
}`;

const curlExample = (url: string, key: string) =>
  `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${key ? key.slice(0, 20) + "..." : "<YOUR_ANON_KEY>"}" \\
  -d '${samplePayload}'`;

export default function IntegrationsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground">Connect external lead sources for automatic lead capture</p>
      </div>

      {/* API Endpoint Card */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Lead Capture API Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Endpoint URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm text-foreground font-mono break-all">
                POST {API_URL}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(API_URL, "URL")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Required Fields</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">name</Badge>
              <Badge variant="default">phone</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Optional: email, source, location, budget, property_interest, notes</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Sample Payload (JSON)</p>
            <div className="relative">
              <pre className="rounded bg-muted p-3 text-xs text-foreground font-mono overflow-x-auto">{samplePayload}</pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1"
                onClick={() => copyToClipboard(samplePayload, "Payload")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">cURL Example</p>
            <div className="relative">
              <pre className="rounded bg-muted p-3 text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap">
                {curlExample(API_URL, ANON_KEY)}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1"
                onClick={() => copyToClipboard(curlExample(API_URL, ANON_KEY), "cURL")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="rounded bg-primary/5 border border-primary/20 p-3">
            <p className="text-sm text-foreground font-medium">ℹ️ How it works</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
              <li>POST lead data to the endpoint above from any website form, ad platform, or webhook</li>
              <li>Leads are auto-created in the CRM with source tracking</li>
              <li>If Round Robin is enabled, leads are auto-assigned to agents</li>
              <li>Assigned agents receive a notification automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Integration Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <integration.icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground text-sm">{integration.name}</p>
                  <Badge
                    variant={integration.status === "active" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {integration.status === "active" ? "Active" : "Use API"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
