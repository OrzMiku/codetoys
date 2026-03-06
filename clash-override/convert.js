// =================================================================
// = constants
// =================================================================

const DEBUG = false;

const FEATURES = {
  COMMON: true, // common settings
  DNS: true, // dns settings
  TUN: false, // tun settings
  SNIFFER: true, // sniffer settings
  // whether to include all proxies in the main group
  INCLUDE_ALL_PROXIES_IN_MAIN_GROUP: false,
};

const MAIN_GROUP_NAME = "节点选择";
const REGIONS = [
  { code: "HK", name: "香港", regex: /(香港|HK|Hong Kong|🇭🇰)/i },
  { code: "TW", name: "台湾", regex: /(台湾|台灣|TW|Taiwan|🇹🇼)/i },
  { code: "SG", name: "新加坡", regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i },
  { code: "JP", name: "日本", regex: /(日本|JP|Japan|东京|🇯🇵)/i },
  {
    code: "US",
    name: "美国",
    regex: /(美国|美國|US|USA|United States|America|🇺🇸)/i,
  },
  { code: "DE", name: "德国", regex: /(德国|DE|Germany|🇩🇪)/i },
  { code: "KR", name: "韩国", regex: /(韩国|韓國|KR|Korea|South Korea|🇰🇷)/i },
  { code: "UK", name: "英国", regex: /(英国|UK|United Kingdom|🇬🇧)/i },
  { code: "CA", name: "加拿大", regex: /(加拿大|CA|Canada|🇨🇦)/i },
  { code: "AU", name: "澳大利亚", regex: /(澳大利亚|AU|Australia|🇦🇺)/i },
  { code: "FR", name: "法国", regex: /(法国|FR|France|🇫🇷)/i },
  { code: "RU", name: "俄罗斯", regex: /(俄罗斯|RU|Russia|🇷🇺)/i },
  { code: "TR", name: "土耳其", regex: /(土耳其|TR|Turkey|🇹🇷)/i },
];
const FILTER_REGEX =
  /^(?!.*(官网|套餐|流量|expiring|剩余|时间|重置|URL|到期|过期|机场|group|sub|订阅|查询|续费|观看|频道|客服|M3U|车费|车友|上车|通知|公告|严禁|未知|Channel)).*$/i;

// =================================================================
// = main
// =================================================================

function main(config) {
  const common = FEATURES.COMMON ? buildCommonSettings() : {};
  const dns = FEATURES.DNS ? buildDns() : {};
  const tun = FEATURES.TUN ? buildTun() : {};
  const sniffer = FEATURES.SNIFFER ? buildSniffer() : {};

  const proxies = filterProxies(buildProxies(config), FILTER_REGEX);
  const proxy_groups = buildProxyGroups(
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
    "proxy-groups": proxy_groups,
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
    "log-level": "info",
    "find-process-mode": "always",
    "bind-address": "*",
    profile: {
      "store-selected": true,
      "store-fake-ip": true,
    },
    "geo-auto-update": true,
    "geo-update-interval": 24,
    "geox-url": {
      gepip:
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
      mtu: 1500,
    },
  };
}

function buildDns() {
  return {
    dns: {
      enable: true,
      ipv6: true,
      "prefer-h3": true,
      "respect-rules": true,
      "default-nameserver": ["tls://223.5.5.5", "tls://223.6.6.6"],
      nameserver: [
        "https://cloudflare-dns.com/dns-query",
        "https://dns.google/dns-query",
      ],
      "proxy-server-nameserver": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
      ],
      "direct-nameserver": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query",
      ],
      "enhanced-mode": "fake-ip",
      "fake-ip-range": "198.18.0.1/16",
      "fake-ip-filter": ["rule-set:fakeipFilter", "rule-set:trackerslist"],
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
          ports: [80, 443],
          "override-destination": false,
        },
        TLS: {
          ports: [443],
        },
      },
      "skip-domain": ["+.push.apple.com"],
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

function filterProxies(proxies, regex) {
  return proxies.filter((proxy) => regex.test(proxy.name));
}

function buildProxies(config) {
  let proxies = config.proxies || [];

  // proxy providers
  if (!config["proxy-providers"]) return proxies;
  const proxyProviders = config["proxy-providers"];
  const fs = require("fs");
  const path = require("path");
  const yaml = require("yaml");
  Object.values(proxyProviders).forEach((provider) => {
    if (!provider.path) return;
    const filepath = path.resolve(__dirname, "../", provider.path);
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      const data = yaml.parse(content);
      if (data.proxies) proxies = proxies.concat(data.proxies);
    } catch (e) {
      console.error(`Error reading ${filepath}:`, e);
    }
  });

  return proxies;
}

function buildProxyGroups(
  proxies,
  regions,
  main_group_name,
  include_all_proxies_in_main_group,
) {
  // region groups
  const region_groups = regions.map((region) => {
    const region_proxies = filterProxies(proxies, region.regex);
    if (!region_proxies.length) return null;
    const base = {
      name: region.name,
      type: "url-test",
      icon: `https://cdn.jsdelivr.net/gh/Orz-3/mini@master/Color/${region.code}.png`,
      proxies: region_proxies.map((proxy) => proxy.name),
    };
    return base;
  });

  // Filter out null region groups
  const valid_region_groups = region_groups.filter((group) => group !== null);

  // unknown region group
  const matched_proxies = new Set();
  valid_region_groups.forEach((group) => {
    group.proxies.forEach((name) => matched_proxies.add(name));
  });
  const other_proxies = proxies.filter(
    (proxy) => !matched_proxies.has(proxy.name),
  );
  if (other_proxies.length > 0) {
    valid_region_groups.push({
      name: "未知地区",
      type: "select",
      icon: "https://cdn.jsdelivr.net/gh/Orz-3/mini@master/Color/UN.png",
      proxies: other_proxies.map((proxy) => proxy.name),
    });
  }

  // main groups
  const main_group = {
    name: main_group_name,
    type: "select",
    proxies: [
      ...valid_region_groups.map((group) => group.name),
      "DIRECT",
      ...(include_all_proxies_in_main_group
        ? proxies.map((proxy) => proxy.name)
        : []),
    ],
  };

  return [main_group, ...valid_region_groups];
}

function buildRules(main_group_name) {
  return {
    "rule-providers": {
      reject: {
        type: "http",
        behavior: "domain",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
        path: "./ruleset/reject.yaml",
      },
      proxy: {
        type: "http",
        behavior: "domain",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
        path: "./ruleset/proxy.yaml",
      },
      direct: {
        type: "http",
        behavior: "domain",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
        path: "./ruleset/direct.yaml",
      },
      private: {
        type: "http",
        behavior: "domain",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
        path: "./ruleset/private.yaml",
      },
      cncidr: {
        type: "http",
        behavior: "ipcidr",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
        path: "./ruleset/cncidr.yaml",
      },
      lancidr: {
        type: "http",
        behavior: "ipcidr",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
        path: "./ruleset/lancidr.yaml",
      },
      applications: {
        type: "http",
        behavior: "classical",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
        path: "./ruleset/applications.yaml",
      },
      fakeipFilter: {
        type: "http",
        behavior: "domain",
        format: "mrs",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/fakeip-filter.mrs",
        path: "./ruleset/fakeip-filter.yaml",
      },
      trackerslist: {
        type: "http",
        behavior: "domain",
        format: "mrs",
        interval: 86400,
        url: "https://cdn.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/trackerslist.mrs",
        path: "./ruleset/trackerslist.yaml",
      },
      customProxy: {
        type: "http",
        behavior: "domain",
        interval: 86400,
        url: "https://codeberg.org/OrzMiku/codetoys/raw/branch/main/clash-override/rules/custom-proxy.yaml",
        path: "./ruleset/custom-proxy.yaml",
      },
      customDirect: {
        type: "http",
        behavior: "domain",
        interval: 86400,
        url: "https://codeberg.org/OrzMiku/codetoys/raw/branch/main/clash-override/rules/custom-direct.yaml",
        path: "./ruleset/custom-direct.yaml",
      },
    },
    rules: [
      `RULE-SET,customProxy,${main_group_name}`,
      `RULE-SET,customDirect,DIRECT`,
      "RULE-SET,applications,DIRECT",
      "DOMAIN,clash.razord.top,DIRECT",
      "DOMAIN,yacd.haishan.me,DIRECT",
      "RULE-SET,private,DIRECT,no-resolve",
      "RULE-SET,reject,REJECT",
      `RULE-SET,proxy,${main_group_name}`,
      "RULE-SET,direct,DIRECT",
      "RULE-SET,lancidr,DIRECT",
      "RULE-SET,cncidr,DIRECT",
      "GEOIP,LAN,DIRECT",
      "GEOIP,CN,DIRECT",
      `MATCH,${main_group_name}`,
    ],
  };
}

