import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Facebook, BarChart3, MessageCircle, Copy, CheckCircle2, ExternalLink, Zap } from "lucide-react";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  endpoint: string;
  description: string;
  method: string;
  verifySupport: boolean;
  setupSteps: string[];
  samplePayload: string;
  providerLinks?: { label: string; url: string }[];
}

const integrations: Integration[] = [
  {
    id: "website",
    name: "Website Form API",
    icon: Globe,
    endpoint: `${BASE_URL}/capture-lead`,
    method: "POST",
    description: "Universal lead capture endpoint. Use from any website form, Zapier, Make, or custom integration.",
    verifySupport: false,
    setupSteps: [
      "Copy the webhook URL below",
      "Send a POST request with JSON body containing name and phone",
      "Leads will be created automatically in your CRM",
    ],
    samplePayload: JSON.stringify({ name: "Raj Sharma", phone: "9876543210", email: "raj@example.com", source: "Website", location: "Mumbai", budget: "₹50 Lakh" }, null, 2),
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    icon: MessageCircle,
    endpoint: `${BASE_URL}/whatsapp-webhook`,
    method: "POST",
    description: "Receives WhatsApp messages via Meta Cloud API or providers like Twilio, WATI, Gupshup, Interakt.",
    verifySupport: true,
    setupSteps: [
      "Sign up with a WhatsApp Business API provider (Twilio, WATI, Gupshup, or Interakt)",
      "Set the webhook URL below in your provider's dashboard",
      "For Meta Cloud API: set the Verify Token to crm_whatsapp_verify",
      "Incoming messages will auto-create leads in your CRM",
    ],
    samplePayload: JSON.stringify({ from: "+919876543210", body: "I'm interested in a plot in Pune", name: "Ravi Kumar" }, null, 2),
    providerLinks: [
      { label: "Twilio", url: "https://www.twilio.com/whatsapp" },
      { label: "WATI", url: "https://www.wati.io" },
      { label: "Gupshup", url: "https://www.gupshup.io" },
      { label: "Interakt", url: "https://www.interakt.shop" },
    ],
  },
  {
    id: "facebook",
    name: "Facebook Lead Ads",
    icon: Facebook,
    endpoint: `${BASE_URL}/facebook-webhook`,
    method: "POST",
    description: "Captures leads from Facebook/Instagram Lead Ad forms via Meta Webhooks or Zapier.",
    verifySupport: true,
    setupSteps: [
      "Create a Meta App at developers.facebook.com",
      "Enable Webhooks and subscribe to Lead Generation",
      "Set the webhook URL below and Verify Token to crm_facebook_verify",
      "Or use Zapier/Make to forward leads to this endpoint",
    ],
    samplePayload: JSON.stringify({ name: "Priya Patel", phone_number: "+919123456789", email: "priya@example.com" }, null, 2),
    providerLinks: [
      { label: "Meta Developer Portal", url: "https://developers.facebook.com" },
      { label: "Zapier", url: "https://zapier.com/apps/facebook-lead-ads" },
    ],
  },
  {
    id: "google",
    name: "Google Ads Lead Forms",
    icon: BarChart3,
    endpoint: `${BASE_URL}/google-webhook`,
    method: "POST",
    description: "Captures leads from Google Ads Lead Form Extensions via webhook or Zapier integration.",
    verifySupport: false,
    setupSteps: [
      "Set up Lead Form Extensions in your Google Ads campaign",
      "Use Zapier or Make to forward form submissions to the webhook URL below",
      "Or use the Google Ads API to send leads directly",
    ],
    samplePayload: JSON.stringify({ name: "Akash Singh", phone: "+919876543210", email: "akash@example.com", location: "Delhi" }, null, 2),
    providerLinks: [
      { label: "Google Ads API", url: "https://developers.google.com/google-ads/api" },
      { label: "Zapier", url: "https://zapier.com/apps/google-ads" },
    ],
  },
];

export default function IntegrationsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: `${label} copied` });
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = (integration: Integration) =>
    `curl -X POST "${integration.endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${ANON_KEY ? ANON_KEY.slice(0, 20) + "..." : "<ANON_KEY>"}" \\
  -d '${integration.samplePayload}'`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground">Connect external lead sources for automatic capture</p>
      </div>

      {/* API Key */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">API Key</p>
              <p className="text-xs text-muted-foreground">Include as <code className="text-xs">apikey</code> header in all requests</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-xs font-mono text-foreground">
                {ANON_KEY ? ANON_KEY.slice(0, 24) + "..." : "Not configured"}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyText(ANON_KEY, "API Key")}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Tabs */}
      <Tabs defaultValue="website">
        <TabsList className="grid w-full grid-cols-4">
          {integrations.map((i) => (
            <TabsTrigger key={i.id} value={i.id} className="text-xs gap-1">
              <i.icon className="h-3.5 w-3.5" /> {i.name.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {integrations.map((integration) => (
          <TabsContent key={integration.id} value={integration.id} className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <integration.icon className="h-4 w-4 text-primary" /> {integration.name}
                  </CardTitle>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Webhook URL */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Webhook URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono text-foreground break-all">
                      {integration.method} {integration.endpoint}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => copyText(integration.endpoint, "URL")}>
                      {copied === "URL" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Setup Steps */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Setup Steps</p>
                  <ol className="space-y-1.5">
                    {integration.setupSteps.map((step, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Provider Links */}
                {integration.providerLinks && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Platforms & Providers</p>
                    <div className="flex flex-wrap gap-2">
                      {integration.providerLinks.map((link) => (
                        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted gap-1">
                            {link.label} <ExternalLink className="h-2.5 w-2.5" />
                          </Badge>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Payload */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sample Payload</p>
                  <div className="relative">
                    <pre className="rounded bg-muted p-3 text-xs font-mono text-foreground overflow-x-auto">{integration.samplePayload}</pre>
                    <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => copyText(integration.samplePayload, "Payload")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* cURL Example */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">cURL Example</p>
                  <div className="relative">
                    <pre className="rounded bg-muted p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">{curlExample(integration)}</pre>
                    <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => copyText(curlExample(integration), "cURL")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No-Code Alternative */}
            <Card className="border-dashed">
              <CardContent className="flex items-center gap-3 p-4">
                <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">No-Code Alternative</p>
                  <p className="text-xs text-muted-foreground">
                    Use <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Zapier</a>,{" "}
                    <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Make</a>, or{" "}
                    <a href="https://zoho.com/flow" target="_blank" rel="noopener noreferrer" className="text-primary underline">Zoho Flow</a> to connect{" "}
                    {integration.name} without any coding.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
