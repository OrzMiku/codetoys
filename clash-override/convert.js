// =================================================================
// = constants
// =================================================================

const DEBUG = false;

const FEATURES = {
  COMMON: true, // common settings
  DNS: true, // dns settings
  TUN: true, // tun settings
  SNIFFER: true, // sniffer settings
  // whether to include all proxies in the main group
  INCLUDE_ALL_PROXIES_IN_MAIN_GROUP: false,
};

const MAIN_GROUP_NAME = "节点选择";
const REGIONS = [
  {
    code: "HK",
    name: "香港",
    flag: "🇭🇰",
    regex: /香港|(?:^|[^a-z])(?:HK|Hong[ -]?Kong)(?=$|[^a-z])/i,
  },
  {
    code: "TW",
    name: "台湾",
    flag: "🇹🇼",
    regex: /台湾|台灣|(?:^|[^a-z])(?:TW|Taiwan)(?=$|[^a-z])/i,
  },
  {
    code: "SG",
    name: "新加坡",
    flag: "🇸🇬",
    regex: /新加坡|狮城|獅城|(?:^|[^a-z])(?:SG|Singapore)(?=$|[^a-z])/i,
  },
  {
    code: "JP",
    name: "日本",
    flag: "🇯🇵",
    regex: /日本|东京|東京|(?:^|[^a-z])(?:JP|Japan)(?=$|[^a-z])/i,
  },
  {
    code: "US",
    name: "美国",
    flag: "🇺🇸",
    regex: /美国|美國|(?:^|[^a-z])(?:US|USA|United[ -]?States|America)(?=$|[^a-z])/i,
  },
  {
    code: "DE",
    name: "德国",
    flag: "🇩🇪",
    regex: /德国|德國|(?:^|[^a-z])(?:DE|Germany)(?=$|[^a-z])/i,
  },
  {
    code: "KR",
    name: "韩国",
    flag: "🇰🇷",
    regex: /韩国|韓國|(?:^|[^a-z])(?:KR|Korea|South[ -]?Korea)(?=$|[^a-z])/i,
  },
  {
    code: "UK",
    name: "英国",
    flag: "🇬🇧",
    regex: /英国|英國|(?:^|[^a-z])(?:UK|GB|United[ -]?Kingdom)(?=$|[^a-z])/i,
  },
  {
    code: "CA",
    name: "加拿大",
    flag: "🇨🇦",
    regex: /加拿大|(?:^|[^a-z])(?:CA|Canada)(?=$|[^a-z])/i,
  },
  {
    code: "AU",
    name: "澳大利亚",
    flag: "🇦🇺",
    regex: /澳大利亚|澳大利亞|澳洲|(?:^|[^a-z])(?:AU|Australia)(?=$|[^a-z])/i,
  },
  {
    code: "FR",
    name: "法国",
    flag: "🇫🇷",
    regex: /法国|法國|(?:^|[^a-z])(?:FR|France)(?=$|[^a-z])/i,
  },
  {
    code: "RU",
    name: "俄罗斯",
    flag: "🇷🇺",
    regex: /俄罗斯|俄羅斯|(?:^|[^a-z])(?:RU|Russia)(?=$|[^a-z])/i,
  },
  {
    code: "TR",
    name: "土耳其",
    flag: "🇹🇷",
    regex: /土耳其|(?:^|[^a-z])(?:TR|Turkey)(?=$|[^a-z])/i,
  },
];
const FILTER_REGEX =
  /^(?!.*(官网|套餐|流量|expiring|剩余|时间|重置|URL|到期|过期|机场|group|sub|订阅|查询|续费|观看|频道|客服|M3U|车费|车友|上车|通知|公告|严禁|未知|Channel|建议)).*$/i;

// =================================================================
// = main
// =================================================================

function main(config = {}) {
  if (!isRecord(config)) {
    throw new TypeError("config must be an object");
  }
  const common = FEATURES.COMMON ? buildCommonSettings() : {};
  const dns = FEATURES.DNS ? buildDns() : {};
  const tun = FEATURES.TUN ? buildTun() : {};
  const sniffer = FEATURES.SNIFFER ? buildSniffer() : {};

  const proxies = normalizeProxies(filterProxies(buildProxies(config), FILTER_REGEX));
  const proxyGroups = buildProxyGroups(
    proxies,
    REGIONS,
    MAIN_GROUP_NAME,
    FEATURES.INCLUDE_ALL_PROXIES_IN_MAIN_GROUP,
  );

  const rules = buildRules(MAIN_GROUP_NAME);

  const result = {
    ...common,
    ...tun,
    ...dns,
    ...sniffer,
    proxies,
    "proxy-groups": proxyGroups,
    ...rules,
  };

  if (DEBUG) console.log(result);
  return result;
}

// =================================================================
// = utils
// =================================================================

function buildCommonSettings() {
  return {
    "mixed-port": 7890,
    "allow-lan": false,
    "log-level": "warning",
    "find-process-mode": "strict",
    "bind-address": "*",
    profile: {
      "store-selected": true,
      "store-fake-ip": true,
    },
    "geodata-mode": true,
    "geo-auto-update": true,
    "geo-update-interval": 24,
    "geox-url": {
      geoip:
        "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip-lite.dat",
      geosite:
        "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
      mmdb: "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.metadb",
      asn: "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb",
    },
  };
}

function buildTun() {
  return {
    tun: {
      enable: true,
      device: "mohomo",
      stack: "mixed",
      "dns-hijack": ["any:53"],
      "auto-route": true,
      "auto-detect-interface": true,
      "strict-route": true,
      mtu: 1500,
    },
  };
}

function buildDns() {
  return {
    dns: {
      enable: true,
      "cache-algorithm": "arc",
      ipv6: false,
      "prefer-h3": false,
      "respect-rules": true,
      "default-nameserver": ["223.5.5.5", "119.29.29.29"],
      nameserver: ["https://1.1.1.1/dns-query", "https://8.8.8.8/dns-query"],
      "proxy-server-nameserver": ["223.5.5.5", "119.29.29.29"],
      "direct-nameserver": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
      ],
      "enhanced-mode": "fake-ip",
      "fake-ip-range": "198.18.0.1/16",
      "fake-ip-filter": ["rule-set:fakeipFilter"],
    },
  };
}

function buildSniffer() {
  return {
    sniffer: {
      enable: true,
      "parse-pure-ip": true,
      "force-dns-mapping": true,
      "override-destination": false,
      sniff: {
        HTTP: {
          ports: [80, "8080-8880"],
          "override-destination": true,
        },
        TLS: {
          ports: [443, 8443],
        },
        QUIC: {
          ports: [443, 8443],
        },
      },
      "skip-domain": ["+.push.apple.com", "rule-set:fakeipFilter"],
      "skip-dst-address": [
        "91.105.192.0/23",
        "91.108.4.0/22",
        "91.108.8.0/21",
        "91.108.16.0/21",
        "91.108.56.0/22",
        "95.161.64.0/20",
        "149.154.160.0/20",
        "185.76.151.0/24",
        "2001:67c:4e8::/48",
        "2001:b28:f23c::/47",
        "2001:b28:f23f::/48",
        "2a0a:f280:203::/48",
      ],
    },
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function filterProxies(proxies, regex) {
  return proxies.filter((proxy) => {
    if (!isRecord(proxy) || typeof proxy.name !== "string" || !proxy.name.trim()) {
      throw new TypeError("Each proxy must be an object with a non-empty name");
    }
    // Global and sticky expressions otherwise retain state between nodes.
    regex.lastIndex = 0;
    return regex.test(proxy.name);
  });
}

function normalizeProxies(proxies) {
  const reservedNames = new Set([
    "DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE", "GLOBAL",
    MAIN_GROUP_NAME, "未知地区", ...REGIONS.map((region) => region.name),
  ]);
  const seen = new Set();
  return proxies.filter((proxy) => {
    if (reservedNames.has(proxy.name)) {
      throw new Error(`Proxy name conflicts with a group or built-in target: ${proxy.name}`);
    }
    // Keep the first definition: inline proxies precede provider entries.
    if (seen.has(proxy.name)) return false;
    seen.add(proxy.name);
    return true;
  });
}

function buildProxies(config) {
  const proxies = config.proxies === undefined ? [] : config.proxies;
  if (!Array.isArray(proxies)) throw new TypeError("config.proxies must be an array");
  const result = [...proxies];
  const providers = config["proxy-providers"];
  if (providers === undefined) return result;
  if (!isRecord(providers)) throw new TypeError("proxy-providers must be an object");

  const entries = Object.entries(providers);
  if (entries.length === 0) return result;
  if (typeof require !== "function" || typeof __dirname !== "string") {
    throw new Error("Loading proxy-providers requires a Node.js host with require and __dirname");
  }
  const fs = require("fs");
  const path = require("path");
  const yaml = require("yaml");
  for (const [name, provider] of entries) {
    if (!isRecord(provider) || typeof provider.path !== "string" || !provider.path.trim()) {
      throw new TypeError(`Provider ${name} requires a local cache path`);
    }
    const filepath = path.resolve(__dirname, "../", provider.path);
    try {
      const data = yaml.parse(fs.readFileSync(filepath, "utf-8"));
      if (!isRecord(data) || !Array.isArray(data.proxies)) {
        throw new TypeError("Expected an object containing a proxies array");
      }
      for (const proxy of data.proxies) result.push(proxy);
    } catch (error) {
      // A partial subscription can silently change routing; report failure to the host.
      throw new Error(`Failed to load provider ${name} (${filepath}): ${error.message}`);
    }
  }
  return result;
}

function findRegion(name, regions) {
  // Flags take priority over text. Unsupported or conflicting flags remain unknown.
  const flags = name.match(/[\u{1F1E6}-\u{1F1FF}]{2}/gu) || [];
  if (flags.length > 0) {
    const uniqueFlags = new Set(flags);
    if (uniqueFlags.size !== 1) return null;
    return regions.find((region) => region.flag === flags[0]) || null;
  }

  // Do not guess the destination of names containing multiple regions.
  const matches = regions.filter((region) => region.regex.test(name));
  return matches.length === 1 ? matches[0] : null;
}

function buildProxyGroups(
  proxies,
  regions,
  mainGroupName,
  includeAllProxiesInMainGroup,
) {
  const buckets = new Map(regions.map((r) => [r.code, []]));
  const unknown = [];
  for (const proxy of proxies) {
    const region = findRegion(proxy.name, regions);
    if (region) buckets.get(region.code).push(proxy.name);
    else unknown.push(proxy.name);
  }

  const regionGroups = regions
    .filter((r) => buckets.get(r.code).length > 0)
    .map((r) => ({
      name: r.name,
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      icon: `https://cdn.jsdelivr.net/gh/Orz-3/mini@master/Color/${r.code}.png`,
      proxies: buckets.get(r.code),
    }));

  if (unknown.length > 0) {
    regionGroups.push({
      name: "未知地区",
      type: "select",
      icon: "https://cdn.jsdelivr.net/gh/Orz-3/mini@master/Color/UN.png",
      proxies: unknown,
    });
  }

  const mainGroup = {
    name: mainGroupName,
    type: "select",
    proxies: [
      ...regionGroups.map((g) => g.name),
      "DIRECT",
      ...(includeAllProxiesInMainGroup ? proxies.map((p) => p.name) : []),
    ],
  };

  return [mainGroup, ...regionGroups];
}

function buildRules(mainGroupName) {
  return {
    "rule-providers": {
      ...Object.fromEntries([
        ["reject", "domain"],
        ["proxy", "domain"],
        ["direct", "domain"],
        ["private", "domain"],
        ["cncidr", "ipcidr"],
        ["lancidr", "ipcidr"],
        ["applications", "classical"],
      ].map(([name, behavior]) => [name, {
        type: "http",
        behavior,
        interval: 86400,
        url: `https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/${name}.txt`,
        path: `./ruleset/${name}.yaml`,
      }])),
      fakeipFilter: {
        type: "http",
        behavior: "domain",
        format: "mrs",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/fakeip-filter.mrs",
        path: "./ruleset/fakeip-filter.mrs",
      },
    },
    rules: [
      "RULE-SET,applications,DIRECT",
      "DOMAIN,clash.razord.top,DIRECT",
      "DOMAIN,yacd.haishan.me,DIRECT",
      "RULE-SET,private,DIRECT",
      "RULE-SET,reject,REJECT",
      `RULE-SET,proxy,${mainGroupName}`,
      "RULE-SET,direct,DIRECT",
      "RULE-SET,lancidr,DIRECT,no-resolve",
      "RULE-SET,cncidr,DIRECT,no-resolve",
      "GEOIP,LAN,DIRECT,no-resolve",
      "GEOIP,CN,DIRECT,no-resolve",
      `MATCH,${mainGroupName}`,
    ],
  };
}
