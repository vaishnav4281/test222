import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, AlertTriangle, ListChecks, MapPin, WifiOff, Server, CheckCircle } from "lucide-react";
import { API_BASE_URL } from '../config';

interface ResultItem {
  domain: string;
  ip_address: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  abuse_score?: number;
  is_vpn_proxy?: boolean;
}

interface SecurityIntelPanelProps {
  results: ResultItem[];
}

type IpqsData = {
  fraud_score?: number;
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
  country_code?: string;
  country?: string;
  region?: string;
  city?: string;
  ISP?: string;
  isp?: string;
  organization?: string;
};

type AbuseData = {
  data?: {
    abuseConfidenceScore?: number;
    totalReports?: number;
    lastReportedAt?: string;
  }
};

type DnsblItem = { zone: string; listed: boolean; text: string | null };

type DnsblData = {
  ip: string;
  results: DnsblItem[];
  listedCount: number;
};

export default function SecurityIntelPanel({ results }: SecurityIntelPanelProps) {
  const ips = useMemo(() => {
    const set = new Set<string>();
    (results || []).forEach(r => { if (r?.ip_address) set.add(r.ip_address); });
    return Array.from(set);
  }, [results]);

  const [ipqs, setIpqs] = useState<Record<string, IpqsData | { error: string }>>({});
  const [abuse, setAbuse] = useState<Record<string, AbuseData | { error: string }>>({});
  const [dnsbl, setDnsbl] = useState<Record<string, DnsblData | { error: string }>>({});

  useEffect(() => {
    if (!ips.length) return;

    // Pre-populate with existing data from results (only if data is valid)
    const existingData: Record<string, IpqsData> = {};
    (results || []).forEach((r: any) => {
      if (r?.ip_address && r.ip_address !== '-') {
        // Only pre-populate if we have actual data (not default values)
        const hasValidData = (
          (r.country && r.country !== '-') ||
          (r.isp && r.isp !== '-') ||
          (typeof r.abuse_score === 'number') || // 0 is valid (means clean)
          r.is_vpn_proxy === true
        );

        if (hasValidData) {
          // Only add fields that have actual meaningful values
          const dataObj: any = {};
          if (r.country && r.country !== '-') {
            dataObj.country_code = r.country;
            dataObj.country = r.country;
          }
          if (r.region && r.region !== '-') dataObj.region = r.region;
          if (r.city && r.city !== '-') dataObj.city = r.city;
          if (r.isp && r.isp !== '-') {
            dataObj.ISP = r.isp;
            dataObj.isp = r.isp;
            dataObj.organization = r.isp;
          }
          // Include fraud_score if it's a number (including 0 = clean)
          // Only skip if undefined (not checked yet)
          if (typeof r.abuse_score === 'number') {
            dataObj.fraud_score = r.abuse_score;
          }
          // Only include VPN/proxy if explicitly true
          if (r.is_vpn_proxy === true) {
            dataObj.vpn = true;
            dataObj.proxy = true;
          }

          existingData[r.ip_address] = dataObj;
        }
      }
    });

    // Set existing data first (only if we have valid data)
    if (Object.keys(existingData).length > 0) {
      setIpqs(prev => ({ ...prev, ...existingData }));
      console.log('✅ Pre-populated IP data from results:', existingData);
    }

    const run = async () => {
      for (const ip of ips) {
        // Skip invalid IPs
        const isValidIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);
        if (!isValidIp || ip === '-') continue;

        // Log if using existing data for IPQS
        if (existingData[ip]) {
          console.log('⏭️ Using existing IPQS data for', ip, '- still fetching AbuseIPDB & DNSBL');
        }

        // IPQS: use Vite proxy (skip if we have existing data)
        if (!ipqs[ip] && !existingData[ip]) {
          try {
            const r = await fetch(`${API_BASE_URL}/api/v1/scan/ipqs?ip=${encodeURIComponent(ip)}`);
            if (r.ok) {
              const data = await r.json();
              setIpqs(prev => ({ ...prev, [ip]: data }));
            } else {
              // Fallback: use free ip-api.com for Country/ISP/VPN/Risk score
              console.log('🔄 IPQS failed, using free fallback for', ip);
              const fallbackRes = await fetch(`/api/ip-api/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,region,regionName,city,lat,lon,isp,org,as,proxy,hosting,mobile`);
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                if (fallbackData.status === 'success') {
                  console.log('✅ Fallback data for', ip, fallbackData);
                  // Estimate fraud score based on hosting/proxy indicators
                  let estimatedFraudScore = 0;
                  const isHosting = Boolean(fallbackData.hosting);
                  const isProxy = Boolean(fallbackData.proxy);
                  if (isHosting) estimatedFraudScore += 40;
                  if (isProxy) estimatedFraudScore += 50;

                  setIpqs(prev => ({
                    ...prev, [ip]: {
                      country_code: fallbackData.countryCode,
                      country: fallbackData.country,
                      region: fallbackData.regionName,
                      city: fallbackData.city,
                      ISP: fallbackData.isp || fallbackData.org,
                      isp: fallbackData.isp || fallbackData.org,
                      organization: fallbackData.org,
                      proxy: isProxy,
                      vpn: isProxy, // Use proxy as VPN indicator
                      tor: false, // ip-api.com doesn't detect Tor specifically
                      fraud_score: estimatedFraudScore,
                    }
                  }));
                  console.log('📊 Estimated fraud score:', estimatedFraudScore);
                }
              }
            }
          } catch (err) {
            console.warn('SecurityIntel IPQS failed for', ip, err);
          }
        }

        // AbuseIPDB: use Vite proxy
        if (!abuse[ip]) {
          try {
            const r = await fetch(`${API_BASE_URL}/api/v1/scan/abuseipdb?ip=${encodeURIComponent(ip)}`);
            if (r.ok) {
              const data = await r.json();
              setAbuse(prev => ({ ...prev, [ip]: data }));
            } else {
              // Fallback: estimate abuse score from DNSBL results
              console.log('🔄 AbuseIPDB failed, will estimate from DNSBL for', ip);
              // Wait for DNSBL check, then estimate
              setTimeout(async () => {
                const dnsblCheck = dnsbl[ip] as DnsblData | undefined;
                if (dnsblCheck && typeof dnsblCheck.listedCount === 'number') {
                  // Estimate abuse score: each blacklist adds ~25 points
                  const estimatedAbuse = Math.min(100, dnsblCheck.listedCount * 25);
                  console.log('📊 Estimated abuse score from DNSBL:', estimatedAbuse);
                  setAbuse(prev => ({
                    ...prev, [ip]: {
                      data: {
                        abuseConfidenceScore: estimatedAbuse,
                        totalReports: dnsblCheck.listedCount,
                        lastReportedAt: new Date().toISOString(),
                      }
                    }
                  }));
                }
              }, 2000);
            }
          } catch (err) {
            console.warn('SecurityIntel AbuseIPDB failed for', ip, err);
          }
        }

        // DNSBL
        if (!dnsbl[ip]) {
          try {
            const r = await fetch(`${API_BASE_URL}/api/v1/scan/dnsbl?ip=${encodeURIComponent(ip)}`);
            if (!r.ok) throw new Error(String(r.status));
            const data = await r.json();
            setDnsbl(prev => ({ ...prev, [ip]: data }));
          } catch {
            // no public fallback for DNSBL
            setDnsbl(prev => ({ ...prev, [ip]: { error: 'DNSBL check failed' } as any }));
          }
        }
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ips)]);

  const getRiskGradient = (score?: number) => {
    const s = typeof score === 'number' ? score : 0;
    if (s >= 75) return 'from-red-500 to-red-600';
    if (s >= 50) return 'from-red-400 to-orange-500';
    if (s >= 25) return 'from-yellow-400 to-orange-400';
    return 'from-emerald-400 to-teal-500';
  };

  // Helper functions for risk score colors (assuming these are defined elsewhere or will be added)
  const getRiskColor = (score?: number) => {
    const s = typeof score === 'number' ? score : 0;
    if (s >= 75) return 'bg-red-500';
    if (s >= 50) return 'bg-orange-500';
    if (s >= 25) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getRiskTextColor = (score?: number) => {
    const s = typeof score === 'number' ? score : 0;
    if (s >= 75) return 'text-red-700 dark:text-red-300';
    if (s >= 50) return 'text-orange-700 dark:text-orange-300';
    if (s >= 25) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-emerald-700 dark:text-emerald-300';
  };

  return (
    <Card className="h-fit border-0 shadow-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
      <CardHeader className="bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-emerald-600/10 border-b border-slate-200/50 dark:border-zinc-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg shadow-pink-500/20 ring-1 ring-white/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Security Intelligence
            </span>
            <Badge className="bg-white/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 backdrop-blur-sm shadow-sm">
              {results.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-zinc-900/50">
        {results.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
              <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-pink-300 dark:text-zinc-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No security data yet</p>
            <p className="text-slate-500 dark:text-zinc-400">Intelligence data will appear here after domain scan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => {
              const ip = result.ip_address; // Assuming result has ip_address
              const ipqsData = ipqs[ip] as IpqsData | undefined;
              const abuseData = abuse[ip] as AbuseData | undefined;
              const dnsblData = dnsbl[ip] as DnsblData | undefined;

              // Check if data has been loaded with actual values (not just empty objects)
              const risk = (ipqsData as any)?.fraud_score as number | undefined;
              const isVpn = (ipqsData as any)?.vpn;
              const isProxy = (ipqsData as any)?.proxy;
              const isTor = (ipqsData as any)?.tor;

              // Data is considered "loaded" only if it has actual values
              const hasIpqsData = ipqsData !== undefined && (
                risk !== undefined ||
                isVpn !== undefined ||
                isProxy !== undefined ||
                (ipqsData as any)?.country_code !== undefined ||
                (ipqsData as any)?.ISP !== undefined
              );
              const hasAbuseData = abuseData !== undefined && abuseData.data !== undefined;
              const country = (ipqsData as any)?.country_code || (ipqsData as any)?.country || '-';
              const isp = (ipqsData as any)?.ISP || (ipqsData as any)?.isp || (ipqsData as any)?.organization || '-';
              const listedCount = (dnsblData as any)?.listedCount as number | undefined;
              const listedZones = ((dnsblData as any)?.results || [])
                .filter((z: DnsblItem | null) => z && z.listed)
                .map((z: DnsblItem) => z.zone);

              const hasVpnProxy = isVpn || isProxy || isTor;
              const abuseScore = abuseData?.data?.abuseConfidenceScore;
              const abuseReports = abuseData?.data?.totalReports;

              // Debug logging
              if (!hasIpqsData && ipqsData !== undefined) {
                console.log(`⚠️ IP ${ip} has empty IPQS data object:`, ipqsData);
              }

              return (
                <div
                  key={index}
                  className="group relative overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Header with Risk Score */}
                  <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 transition-colors ring-1 ring-pink-100 dark:ring-pink-800">
                        <Shield className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white break-all tracking-tight">
                          {result.domain || result.ip_address}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {result.is_vpn_proxy ? (
                            <Badge className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 text-xs shadow-sm animate-pulse">
                              <WifiOff className="h-3 w-3 mr-1" /> VPN/Proxy Detected
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs shadow-sm">
                              <CheckCircle className="h-3 w-3 mr-1" /> Clean Connection
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Risk Score</span>
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-zinc-700">
                          <div className={`w-2.5 h-2.5 rounded-full ${getRiskColor(result.abuse_score)} shadow-[0_0_8px_currentColor]`} />
                          <span className={`text-lg font-bold ${getRiskTextColor(result.abuse_score)}`}>
                            {result.abuse_score}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Intelligence Grid */}
                  <div className="relative p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* IP Information */}
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-3">
                        <Globe className="h-4 w-4 text-blue-500" />
                        IP Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">IP Address</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-zinc-200">{result.ip_address || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">ISP</span>
                          <span className="font-medium text-slate-700 dark:text-zinc-200 truncate max-w-[120px]" title={result.isp}>{result.isp || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">Location</span>
                          <span className="font-medium text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                            {result.country !== '-' && (
                              <img
                                src={`https://flagcdn.com/w20/${result.country?.toLowerCase()}.png`}
                                alt={result.country}
                                className="w-4 h-auto rounded-sm"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            {result.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Threat Intelligence */}
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Threat Intel
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">VPN Detected</span>
                          <Badge variant={result.is_vpn_proxy ? "destructive" : "outline"} className="text-xs">
                            {result.is_vpn_proxy ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">Tor Node</span>
                          <Badge variant="outline" className="text-xs text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700">
                            No
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">Bot Traffic</span>
                          <Badge variant="outline" className="text-xs text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700">
                            Low Probability
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Blacklist Status */}
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-3">
                        <ListChecks className="h-4 w-4 text-emerald-500" />
                        Blacklists
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                          <span className="text-slate-600 dark:text-zinc-400">DNSBL Status</span>
                          <Badge className={`${typeof listedCount === 'number' && listedCount > 0 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'} text-xs`}>
                            {typeof listedCount === 'number' ? (listedCount === 0 ? 'Clean' : `${listedCount} Listed`) : 'Checking...'}
                          </Badge>
                        </div>
                        {listedZones && listedZones.length > 0 && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            Listed in: {listedZones.slice(0, 3).join(', ')}{listedZones.length > 3 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
