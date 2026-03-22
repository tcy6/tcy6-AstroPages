---
title: 修复 macOS 上英雄联盟 (LoL) 语音聊天无法使用麦克风的问题
pubDatetime: 2026-03-23T02:04:00.000Z
description: LOL 台服修复别人听不见自己声音的 Bug
section: life
draft: false
featured: false
tags: []
---
# 修复 macOS 上英雄联盟 (LoL) 语音聊天无法使用麦克风的问题

> 基于 [Reddit 帖子 (2019, macOS Mojave)](https://www.reddit.com/r/leagueoflegends/comments/ay9o4s/how_to_fix_voice_chat_in_macos_mojave/) 的方案，针对现代 macOS 进行了适配和修正。原帖的 SQL 命令因 TCC 数据库 schema 变化（12 列 → 17 列）已无法使用，且操作步骤也需要针对 Apple Silicon 调整。
>
> 测试环境：Apple M5 MacBook Pro, macOS Tahoe 26.3.1 (Build 25D2128)
>
> 适用于：macOS Tahoe 及更新版本的 Apple Silicon Mac

---

## TL;DR

1. 关闭 SIP（需进入恢复模式，详见下文）
2. 重启后在终端执行一条命令写入麦克风权限
3. 重新启用 SIP（再次进入恢复模式）
4. 重启 LoL，语音聊天可用

---

## 完整步骤

### 1. 确认问题

在 LoL 中尝试使用语音聊天，发现队友听不到你的声音，或者麦克风测试无响应。
前往 **系统设置 → 隐私与安全性 → 麦克风**，发现 League of Legends 根本不在列表中。

### 2. 关闭 SIP（系统完整性保护）

TCC 数据库受 SIP 保护，必须先临时关闭 SIP 才能写入。

**Apple Silicon Mac（M 系列芯片）的操作方式：**

1. 完全关机
2. **长按电源键**，直到看到「正在载入启动选项」
3. 点击「选项」→「继续」
4. 在顶部菜单栏选择 **实用工具 → 终端**
5. 输入 `csrutil disable` 并回车
6. 重启

重启后可以在终端验证：

```bash
csrutil status
# 应该显示: System Integrity Protection status: disabled.
```

### 3. 写入麦克风权限

打开终端（Terminal.app），粘贴执行：

```bash
sudo sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db \
  "INSERT or REPLACE INTO access VALUES(\
    'kTCCServiceMicrophone',\
    'com.riotgames.leagueoflegends',\
    0,2,2,1,\
    NULL,NULL,NULL,'UNUSED',NULL,\
    0,CAST(strftime('%s','now') AS INTEGER),\
    NULL,NULL,'UNUSED',0\
  );"
```

输入开机密码后按回车。如果没有任何输出，说明执行成功。

### 4. 验证写入

```bash
sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db \
  "SELECT client, auth_value FROM access WHERE client='com.riotgames.leagueoflegends';"
```

应该输出：

```
com.riotgames.leagueoflegends|2
```

`auth_value=2` 表示已授权。

### 5. 重新启用 SIP

**SIP 是重要的系统安全机制，修复完成后务必重新开启：**

1. 完全关机
2. **长按电源键**，直到看到「正在载入启动选项」
3. 点击「选项」→「继续」
4. 在顶部菜单栏选择 **实用工具 → 终端**
5. 输入 `csrutil enable` 并回车
6. 重启

### 6. 重启 LoL

完全退出 Riot 客户端和 League of Legends，重新启动，进入游戏测试语音聊天。

---

## 注意事项

- **必须临时关闭 SIP。** 已在 macOS Tahoe 26.3.1 上验证：SIP 开启时即使 `sudo` 也无法读写用户级 TCC.db（报 `authorization denied`）。写入完成后务必重新启用 SIP。
- **不需要修改 LoL 的 Info.plist。** Riot 已经在 Info.plist 中包含了 `NSMicrophoneUsageDescription`，无需手动添加。
- **写入的权限记录在重新启用 SIP 后依然有效。** TCC.db 是持久化的 SQLite 数据库，SIP 只是保护它不被修改，不影响已有数据。
- **每次 macOS 大版本升级后可能需要重新执行。** 系统升级有时会重置 TCC 数据库。
- 如果将来 TCC 表结构再次变化（列数不是 17），命令会报错，届时需要用 `.schema access` 查看新结构并调整。

---

## 原理详解

### macOS 的隐私权限系统：TCC

从 macOS Mojave (10.14) 开始，Apple 引入了 **TCC (Transparency, Consent, and Control)** 框架来管理应用对敏感资源（麦克风、摄像头、通讯录、屏幕录制等）的访问。

#### TCC 的工作流程

```
应用请求麦克风 → macOS 检查 TCC 数据库 → 有记录？
                                            ├─ 有 & auth_value=2 → 允许访问
                                            ├─ 有 & auth_value=0 → 拒绝访问
                                            └─ 无记录 → 弹窗询问用户 → 用户选择 → 写入数据库
```

正常情况下，应用首次请求麦克风时，系统会弹出一个对话框让用户授权。用户的选择会被记录到 TCC 数据库中，之后就不会再弹窗了。

#### TCC 数据库的位置

macOS 有两个 TCC 数据库：


| 路径                                                   | 作用    | SIP 开启时     | SIP 关闭时    |
| ---------------------------------------------------- | ----- | ----------- | ---------- |
| `~/Library/Application Support/com.apple.TCC/TCC.db` | 用户级权限 | `sudo` 无法读写 | `sudo` 可读写 |
| `/Library/Application Support/com.apple.TCC/TCC.db`  | 系统级权限 | `sudo` 无法读写 | `sudo` 可读写 |


麦克风权限存储在用户级数据库中。在 macOS Tahoe 上，**SIP 同时保护了两个 TCC 数据库**——即使用 `sudo`，SIP 开启时也无法读写用户级 TCC.db（会报 `authorization denied`）。因此必须临时关闭 SIP 才能修改。写入的记录在重新启用 SIP 后依然有效。

#### TCC 数据库的 `access` 表结构（macOS Tahoe，17 列）

```sql
CREATE TABLE access (
    service                          TEXT    NOT NULL,  -- 服务类型，如 kTCCServiceMicrophone
    client                           TEXT    NOT NULL,  -- 应用的 Bundle Identifier
    client_type                      INTEGER NOT NULL,  -- 0=bundle id, 1=绝对路径
    auth_value                       INTEGER NOT NULL,  -- 0=拒绝, 2=允许
    auth_reason                      INTEGER NOT NULL,  -- 授权原因（2=用户授权, 3=手动设置, 4=系统策略）
    auth_version                     INTEGER NOT NULL,  -- 版本号
    csreq                            BLOB,              -- 代码签名要求（可选）
    policy_id                        INTEGER,           -- 关联策略 ID
    indirect_object_identifier_type  INTEGER,           -- 间接对象类型
    indirect_object_identifier       TEXT    NOT NULL DEFAULT 'UNUSED',
    indirect_object_code_identity    BLOB,              -- 间接对象代码签名
    flags                            INTEGER,           -- 标志位
    last_modified                    INTEGER NOT NULL,   -- 最后修改时间（Unix 时间戳）
    pid                              INTEGER,           -- 进程 ID（Sequoia 起新增）
    pid_version                      INTEGER,           -- 进程版本（Sequoia 起新增）
    boot_uuid                        TEXT    NOT NULL DEFAULT 'UNUSED',  -- 启动 UUID（Sequoia 起新增）
    last_reminded                    INTEGER NOT NULL    -- 上次提醒时间（Sequoia 起新增）
);
```

这个表从 Mojave 时代的 12 列扩展到了现在的 17 列，这就是为什么网上 2019 年的旧命令会报错 `table access has 17 columns but 12 values were supplied`。

### 命令中每个字段的含义

```
'kTCCServiceMicrophone'              -- 请求的服务：麦克风
'com.riotgames.leagueoflegends'      -- LoL 的 Bundle ID（通过 Info.plist 确认）
0                                    -- client_type: Bundle Identifier 方式标识
2                                    -- auth_value: 已授权（2=允许）
2                                    -- auth_reason: 用户授权
1                                    -- auth_version: 版本 1
NULL                                 -- csreq: 不指定代码签名要求
NULL                                 -- policy_id: 无关联策略
NULL                                 -- indirect_object_identifier_type: 不适用
'UNUSED'                             -- indirect_object_identifier: 默认值
NULL                                 -- indirect_object_code_identity: 不适用
0                                    -- flags: 无特殊标志
CAST(strftime('%s','now') AS INTEGER) -- last_modified: 当前时间
NULL                                 -- pid: 不指定进程
NULL                                 -- pid_version: 不指定
'UNUSED'                             -- boot_uuid: 默认值
0                                    -- last_reminded: 无需提醒
```

### 与 2019 年 Reddit 方案的对比


|               | 2019 年 Reddit 方案 (Mojave)                  | 当前方案 (Tahoe)             |
| ------------- | ------------------------------------------ | ------------------------ |
| 关闭/重启 SIP     | 需要                                         | 需要                       |
| 修改 Info.plist | 需要（Riot 没加 `NSMicrophoneUsageDescription`） | **不需要**                  |
| SQL 命令        | 12 列（已过时，会报错）                              | 17 列                     |
| 恢复模式入口        | Command+R（Intel Mac）                       | **长按电源键**（Apple Silicon） |
| 总操作           | 关 SIP + SQL + 改 plist + 开 SIP              | **关 SIP + SQL + 开 SIP**  |


### 如何排查

如果修复后仍不工作，可以依次检查：

```bash
# 1. 确认 TCC 记录存在且 auth_value=2
sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db \
  "SELECT * FROM access WHERE client='com.riotgames.leagueoflegends';"

# 2. 确认 LoL 的 Bundle ID 没有变化
defaults read "/Applications/League of Legends.app/Contents/Info.plist" CFBundleIdentifier

# 3. 确认 Info.plist 包含麦克风使用说明
/usr/libexec/PlistBuddy -c "Print NSMicrophoneUsageDescription" \
  "/Applications/League of Legends.app/Contents/Info.plist"

# 4. 查看 TCC 表结构（如果列数变了需要调整命令）
sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db ".schema access"
```