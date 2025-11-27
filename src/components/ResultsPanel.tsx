
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, Globe, Database, AlertTriangle, Calendar, Clock, Building2, Server, MapPin, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface Result {
  id: number;
  domain: string;
  created: string;
  expires: string;
  domain_age: string;
  registrar: string;
  name_servers: string[];
  dns_records?: string;
  passive_dns?: string;
  asn?: string;
  abuse_score: number;
  is_vpn_proxy: boolean;
  ip_address: string;
  country: string;
  region?: string;
  city?: string;
  longitude?: string;
  latitude?: string;
  isp: string;
  timestamp: string;
}

interface VtSummary {
  reputation?: number;
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  risk_level?: string;
}

interface ResultsPanelProps {
  results: Result[];
  vtSummaryByDomain?: Record<string, VtSummary>;
}

const ResultsPanel = ({ results, vtSummaryByDomain }: ResultsPanelProps) => {
  const { toast } = useToast();

  const exportToCsv = () => {
    if (results.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please run some scans first",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      // Domain Information
      "Domain",
      "Domain Age",
      "Created Date",
      "Expires Date",
      "Registrar",
      // Network Information
      "IP Address",
      "Name Servers",
      "DNS Records",
      "Passive DNS",
      // Geolocation
      "Country",
      "Region",
      "City",
      "Latitude",
      "Longitude",
      "ISP",
      // Security Intelligence
      "VPN/Proxy Detected",
      "Abuse Score",
      "VT Reputation",
      "VT Malicious Count",
      "VT Risk Level",
      // Metadata
      "Scan Timestamp"
    ];

    const escapeCsv = (val: any) => {
      const s = val === null || val === undefined ? '' : String(val);
      // Quote fields that contain commas, semicolons, quotes, newlines, or start with special characters
      if (/[",;\n\r]/.test(s) || s.startsWith(' ') || s.endsWith(' ')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const csvContent = [
      headers.join(","),
      ...results.map(result => {
        const vt = vtSummaryByDomain ? vtSummaryByDomain[result.domain] : undefined;
        const vt_rep = vt?.reputation ?? "-";
        const vt_mal = vt?.malicious ?? "-";
        const vt_risk = vt?.risk_level ?? "-";

        return [
          // Domain Information
          escapeCsv(result.domain),
          escapeCsv(result.domain_age),
          escapeCsv(result.created),
          escapeCsv(result.expires),
          escapeCsv(result.registrar),
          // Network Information
          escapeCsv(result.ip_address),
          escapeCsv((result.name_servers || []).join("; ")),
          escapeCsv(result.dns_records || "-"),
          escapeCsv(result.passive_dns || "-"),
          // Geolocation
          escapeCsv(result.country),
          escapeCsv(result.region || "-"),
          escapeCsv(result.city || "-"),
          escapeCsv(result.latitude || "-"),
          escapeCsv(result.longitude || "-"),
          escapeCsv(result.isp),
          // Security Intelligence
          escapeCsv(result.is_vpn_proxy),
          escapeCsv(result.abuse_score),
          escapeCsv(vt_rep),
          escapeCsv(vt_mal),
          escapeCsv(vt_risk),
          // Metadata
          escapeCsv(result.timestamp)
        ].join(",");
      })

    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `domain_intelligence_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);

    toast({
      title: "Export Complete",
      description: `Exported ${results.length} results to CSV`,
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return "bg-gradient-to-r from-red-500 to-red-600";
    if (score >= 50) return "bg-gradient-to-r from-red-400 to-orange-500";
    if (score >= 25) return "bg-gradient-to-r from-yellow-400 to-orange-400";
    return "bg-gradient-to-r from-green-400 to-blue-500";
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 75) return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    if (score >= 50) return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
    if (score >= 25) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
    return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
  };

  return (
    <Card className="h-fit border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      <CardHeader className="bg-gradient-to-r from-white to-indigo-50/50 dark:from-slate-900 dark:to-slate-800/50 border-b border-indigo-100 dark:border-slate-800 p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md shadow-indigo-500/20">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Scan Results</span>
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {results.length}
            </Badge>
          </CardTitle>
          {results.length > 0 && (
            <Button
              onClick={exportToCsv}
              size="sm"
              variant="outline"
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3">
        {results.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400">
            <div className="bg-indigo-50 dark:bg-slate-800 rounded-full w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
              <Database className="h-8 w-8 sm:h-12 sm:w-12 text-indigo-300 dark:text-slate-600" />
            </div>
            <p className="text-base sm:text-lg font-medium mb-2">No results yet</p>
            <p className="text-sm">Start by analyzing a domain or running a bulk scan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="border border-indigo-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-4 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:scale-[1.01] animate-fade-in group"
                style={{ animationDelay: `${index * 100} ms` }}
              >
                {/* Header with Risk Level */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-3 border-b border-indigo-50 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white break-all">
                        {result.domain}
                      </h3>   {result.is_vpn_proxy && (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-xs font-semibold hover:scale-105 transition-transform duration-300 shadow-md">
                          <Shield className="h-3 w-3 mr-1" />
                          VPN/Proxy Detected
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w - 4 h - 4 rounded - full ${getRiskColor(result.abuse_score)} shadow - lg`}></div>
                    <Badge className={`text - xs font - medium border - 0 ${getRiskBadgeColor(result.abuse_score)} `}>
                      Risk: {result.abuse_score}/100
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 transition-all duration-300">
                      <span className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" /> Created:</span>
                      <span className="text-slate-900 dark:text-white font-semibold">{result.created}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 transition-all duration-300">
                      <span className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Expires:</span>
                      <span className="text-slate-900 dark:text-white font-semibold">{result.expires}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 transition-all duration-300">
                      <span className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-500" /> Registrar:</span>
                      <span className="text-slate-900 dark:text-white font-semibold text-right break-all">{result.registrar}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 transition-all duration-300">
                      <span className="font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2"><Server className="h-4 w-4 text-cyan-500" /> IP Address:</span>
                      <span className="text-slate-900 dark:text-white font-semibold font-mono">{result.ip_address}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 transition-all duration-300">
                      <span className="font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-500" /> Location:</span>
                      <span className="text-slate-900 dark:text-white font-semibold text-right">{result.city !== '-' ? `${result.city}, ` : ''}{result.country}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 transition-all duration-300">
                      <span className="font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2"><Wifi className="h-4 w-4 text-cyan-500" /> ISP:</span>
                      <span className="text-slate-900 dark:text-white font-semibold text-right break-all">{result.isp}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-indigo-50 dark:border-slate-800 pt-3 bg-indigo-50/30 dark:bg-slate-900/50 rounded-lg p-2 flex justify-between items-center">
                  <span><span className="font-medium">Scanned:</span> {result.timestamp}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">ID: {result.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsPanel;
