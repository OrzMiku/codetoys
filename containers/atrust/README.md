# Linux 下使用 aTrust

## 使用 docker 启动 aTrust

> 后续会随 docker 启动，无需再次执行此命令

```bash
docker compose up -d
```

## 登陆并设置代理

容器会暴露这么几个端口：

- 1080：socks 代理端口
- 8888：http 代理端口
- 5901: vnc 端口

我们使用 127.0.0.1:5901 就可以连到容器内，看到 aTrust 登录界面，登陆即可。\
当然我们可以直接在宿主机访问 aTrust 的服务器地址，在网页登陆。\
登陆后配置系统代理即可。

## Clash 兼容

你使用的客户端必须支持 yaml 覆写（当然也可以手动编辑订阅，但是这样做不好）。\
我这里使用的是 sparkle 客户端。我们创建一个覆写，内容为：

```yaml
proxies+:
  - name: socks5
    type: socks5
    server: 127.0.0.1
    port: 1080

proxy-groups+:
  - name: aTrust
    type: url-test
    proxies:
      - socks5
    interval: 60
    url: http://172.25.23.186:8080

+rules:
  - IP-CIDR,172.25.0.0/16,aTrust
```

将覆写设置为全局覆写。clash 使用 tun 模式。

**覆写说明：**

- 追加了一个新的 socks5 节点，这是 docker 容器暴露出来的 socks 节点。
- 追加了一个新的代理组：aTrust。使用 url-test 类型，定期检测延迟，目的是保活。
- 追加了一个分流规则，172.25.0.0/16 走 aTrust 分组，这个 ip 段可能需要根据实际情况修改。
