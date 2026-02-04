import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Server, Globe, MapPin, AlertTriangle, Layers, Activity, Lock } from "lucide-react";

interface ShodanData {
    id?: number;
    ip_str?: string;
    org?: string;
    isp?: string;
    asn?: string;
    country_name?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    os?: string;
    ports?: number[];
    vulns?: string[];
    last_update?: string;
    hostnames?: string[];
    domains?: string[];
    data?: any[]; // Detailed service info
    error?: string;
    timestamp?: string;
}

interface ShodanResultsProps {
    results: ShodanData[];
}

const ShodanResults = ({ results }: ShodanResultsProps) => {
    // Helper function to calculate Attack Surface Score
    const calculateRisk = (result: ShodanData) => {
        let score = 0;
        const alerts: string[] = [];

        // Base score for simply being exposed
        score += 10;

        // Port risk
        result.ports?.forEach(port => {
            score += 5; // Base per port
            if ([21, 23, 445, 3389, 5900].includes(port)) {
                score += 30; // High risk ports
                const portNames: Record<number, string> = { 21: 'FTP', 23: 'Telnet', 445: 'SMB', 3389: 'RDP', 5900: 'VNC' };
                alerts.push(`Critical Port Exposed: ${portNames[port] || port}`);
            }
        });

        // Vulnerability risk
        if (result.vulns?.length) {
            score += result.vulns.length * 15;
            if (result.vulns.length > 5) {
                alerts.push(`High Vulnerability Count (${result.vulns.length})`);
            }
        }

        // Cap score at 100
        return { score: Math.min(score, 100), alerts };
    };

    return (
        <Card className="h-fit border-0 shadow-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-orange-600/10 via-red-600/10 to-amber-600/10 border-b border-slate-200/50 dark:border-zinc-800 p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
                        Shodan Host Analysis
                    </span>
                    <Badge className="bg-white/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 backdrop-blur-sm shadow-sm">
                        {results.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-zinc-900/50">
                {results.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
                            <Layers className="h-10 w-10 sm:h-12 sm:w-12 text-orange-300 dark:text-zinc-600" />
                        </div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No Shodan data yet</p>
                        <p className="text-slate-500 dark:text-zinc-400">Host analysis will appear here after scan</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {results.map((result, index) => {
                            const { score, alerts } = calculateRisk(result);
                            const riskColor = score > 75 ? 'text-red-600' : score > 40 ? 'text-orange-500' : 'text-emerald-500';
                            const riskBg = score > 75 ? 'bg-red-50 dark:bg-red-900/10' : score > 40 ? 'bg-orange-50 dark:bg-orange-900/10' : 'bg-emerald-50 dark:bg-emerald-900/10';

                            return (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Result Content */}
                                    {result.error ? (
                                        <div className="p-6 text-red-500 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5" />
                                            {result.error}
                                        </div>
                                    ) : (
                                        <div className="p-5 sm:p-6 space-y-6">
                                            {/* Header Info */}
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                        <Server className="h-5 w-5 text-orange-500" />
                                                        {result.ip_str}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {result.hostnames && result.hostnames.map(h => (
                                                            <Badge key={h} variant="outline" className="text-xs bg-slate-50 dark:bg-zinc-800">{h}</Badge>
                                                        ))}
                                                        {result.os && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{result.os}</Badge>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-400">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{result.city}, {result.country_name}</span>
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                                        {result.org} ({result.asn})
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Risk Score & Alerts */}
                                            <div className={`p-4 rounded-xl border border-slate-100 dark:border-zinc-800 ${riskBg}`}>
                                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm ${riskColor}`}>
                                                            <Shield className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Attack Surface Score</div>
                                                            <div className={`text-2xl font-bold ${riskColor}`}>
                                                                {score}/100
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {alerts.length > 0 && (
                                                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                                                            {alerts.map((alert, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-white/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/20">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                    {alert}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Tabs defaultValue="ports" className="w-full">
                                                <TabsList className="w-full justify-start bg-slate-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
                                                    <TabsTrigger value="ports">Ports & Services</TabsTrigger>
                                                    <TabsTrigger value="vulns">Vulnerabilities</TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="ports" className="mt-4 space-y-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.ports?.map(port => (
                                                            <Badge key={port} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm px-3 py-1">
                                                                {port}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {result.data?.slice(0, 5).map((service: any, idx: number) => (
                                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-100 dark:border-zinc-700 text-sm">
                                                                <div className="flex justify-between mb-1">
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Port {service.port}/{service.transport}</span>
                                                                    <span className="text-slate-500">{service.product} {service.version}</span>
                                                                </div>
                                                                <pre className="text-xs text-slate-500 dark:text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap font-mono mt-1">
                                                                    {service.data || '(No banner)'}
                                                                </pre>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>

                                                <TabsContent value="vulns" className="mt-4">
                                                    {result.vulns && result.vulns.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {result.vulns.map(vuln => (
                                                                <Badge key={vuln} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200">
                                                                    {vuln}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-500 italic">No vulnerabilities reported.</p>
                                                    )}
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ShodanResults;
