const GROUP = "PROXY";
const OTHER = "其他";

const JUNK =
  /官网|套餐|流量|expiring|剩余|时间|重置|URL|到期|过期|机场|group|sub|订阅|查询|续费|观看|频道|客服|M3U|车费|车友|上车|通知|公告|严禁|未知|Channel|建议/i;

const word = (s) => `(?:^|[^a-z])(?:${s})(?![a-z])`;

const REGIONS = [
  ["香港", "香港|🇭🇰", "HK|Hong[ -]?Kong"],
  ["台湾", "台湾|台灣|🇹🇼", "TW|Taiwan"],
  ["新加坡", "新加坡|狮城|獅城|🇸🇬", "SG|Singapore"],
  ["日本", "日本|东京|東京|🇯🇵", "JP|Japan"],
  ["美国", "美国|美國|🇺🇸", "US|USA|United[ -]?States|America"],
  ["德国", "德国|德國|🇩🇪", "DE|Germany"],
  ["韩国", "韩国|韓國|🇰🇷", "KR|Korea"],
  ["英国", "英国|英國|🇬🇧", "UK|GB|United[ -]?Kingdom"],
  ["加拿大", "加拿大|🇨🇦", "CA|Canada"],
  ["澳大利亚", "澳大利亚|澳大利亞|澳洲|🇦🇺", "AU|Australia"],
  ["法国", "法国|法國|🇫🇷", "FR|France"],
  ["俄罗斯", "俄罗斯|俄羅斯|🇷🇺", "RU|Russia"],
  ["土耳其", "土耳其|🇹🇷", "TR|Turkey"],
].map(([name, cn, en]) => ({ name, re: new RegExp(`${cn}|${word(en)}`, "i") }));

const BASE = {
  "mixed-port": 7890,
  mode: "rule",
  "tcp-concurrent": true,

  "external-controller": "127.0.0.1:9090",
  "external-ui": "ui",
  "external-ui-url":
    "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip",

  "geodata-mode": true,
  "geo-auto-update": true,
  "geo-update-interval": 24,
  "geox-url": {
    geoip: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
    geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
  },

  profile: { "store-selected": true, "store-fake-ip": true },

  tun: { enable: true, stack: "mixed", "strict-route": true },

  dns: {
    enable: true,
    "respect-rules": true,
    nameserver: ["https://1.1.1.1/dns-query", "https://8.8.8.8/dns-query"],
    "direct-nameserver": ["https://223.5.5.5/dns-query"],
    "proxy-server-nameserver": ["https://223.5.5.5/dns-query"],
    "enhanced-mode": "fake-ip",
    "fake-ip-filter": ["+.lan", "+.local"],
  },

  sniffer: {
    enable: true,
    sniff: {
      HTTP: { ports: [80, "8080-8880"], "override-destination": true },
      TLS: { ports: [443, 8443] },
      QUIC: { ports: [443, 8443] },
    },
  },
};

const RULES = [
  "GEOIP,lan,DIRECT,no-resolve",
  "GEOSITE,CN,DIRECT",
  "GEOIP,CN,DIRECT",
  `MATCH,${GROUP}`,
];

function main(config) {
  const seen = new Set();
  const proxies = (config.proxies ?? []).filter((p) => {
    if (!p?.name || JUNK.test(p.name) || seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  const buckets = new Map();
  for (const p of proxies) {
    const name = REGIONS.find((r) => r.re.test(p.name))?.name ?? OTHER;
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push(p.name);
  }

  const regionGroups = [...REGIONS.map((r) => r.name), OTHER]
    .filter((name) => buckets.has(name))
    .map((name) => ({
      name,
      type: "url-test",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: buckets.get(name),
    }));

  const main = {
    name: GROUP,
    type: "select",
    proxies: [...regionGroups.map((g) => g.name), "DIRECT"],
  };

  return { ...BASE, proxies, "proxy-groups": [main, ...regionGroups], rules: RULES };
}
