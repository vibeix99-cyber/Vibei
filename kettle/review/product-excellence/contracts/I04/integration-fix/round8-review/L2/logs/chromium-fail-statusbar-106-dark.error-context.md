# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e6]:
    - link "Skip to content" [ref=e7] [cursor=pointer]:
      - /url: "#main"
    - navigation "Main" [ref=e8]:
      - list [ref=e9]:
        - listitem [ref=e10]:
          - link "Today" [ref=e11] [cursor=pointer]:
            - /url: "#/"
            - img [ref=e15]
            - generic [ref=e19]: Today
        - listitem [ref=e20]:
          - link "Stats" [ref=e21] [cursor=pointer]:
            - /url: "#/stats"
            - img [ref=e24]
            - generic [ref=e28]: Stats
        - listitem [ref=e29]:
          - link "Nook" [ref=e30] [cursor=pointer]:
            - /url: "#/nook"
            - img [ref=e33]
            - generic [ref=e38]: Nook
        - listitem [ref=e39]:
          - link "Settings" [ref=e40] [cursor=pointer]:
            - /url: "#/settings"
            - img [ref=e43]
            - generic [ref=e55]: Settings
    - main [active] [ref=e57]
  - status [ref=e59]
  - generic:
    - status "Notifications":
      - list
```