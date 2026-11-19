# Scheduling the FormO worker

**The delivery worker alone does nothing.** `POST /api/cron/deliver` only sends mail when
something calls it. A scheduler must hit it — every minute is a good default — and the
maintenance endpoint once a day. Both require the same `CRON_SECRET`.

All examples below assume `CRON_SECRET` is set to the same 32+ character value the server uses.

## 1. Vercel Cron (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/deliver", "schedule": "* * * * *" },
    { "path": "/api/cron/maintenance", "schedule": "17 3 * * *" }
  ]
}
```

Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is
configured in the project's environment variables. Keep the variable name exactly `CRON_SECRET`.

## 2. systemd timer pair

`/etc/systemd/system/formo-deliver.service`:

```ini
[Unit]
Description=FormO delivery batch

[Service]
Type=oneshot
Environment=CRON_SECRET=replace-with-the-server-secret
ExecStart=/usr/bin/curl --fail --silent --show-error \
  -X POST -H "Authorization: Bearer ${CRON_SECRET}" \
  https://formo.example.com/api/cron/deliver
```

`/etc/systemd/system/formo-deliver.timer`:

```ini
[Unit]
Description=Run FormO delivery every minute

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
AccuracySec=5s

[Install]
WantedBy=timers.target
```

`/etc/systemd/system/formo-maintenance.service`:

```ini
[Unit]
Description=FormO daily maintenance

[Service]
Type=oneshot
Environment=CRON_SECRET=replace-with-the-server-secret
ExecStart=/usr/bin/curl --fail --silent --show-error \
  -X POST -H "Authorization: Bearer ${CRON_SECRET}" \
  https://formo.example.com/api/cron/maintenance
```

`/etc/systemd/system/formo-maintenance.timer`:

```ini
[Unit]
Description=FormO maintenance daily

[Timer]
OnCalendar=*-*-* 03:17:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable with:

```sh
systemctl daemon-reload
systemctl enable --now formo-deliver.timer formo-maintenance.timer
```

## 3. Plain curl (any scheduler, e.g. crontab)

```sh
# Deliver every minute
* * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://formo.example.com/api/cron/deliver

# Maintain daily
17 3 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://formo.example.com/api/cron/maintenance
```

Immediate manual checks:

```sh
curl -i -X POST -H "Authorization: Bearer $CRON_SECRET" https://formo.example.com/api/cron/maintenance
curl -i "https://formo.example.com/api/health?ready=1"
```

`GET /api/health?ready=1` should report at least 30 days of headroom on each of the four
partitioned tables. `staleQueue` and non-empty default partitions are warnings in the body
but do not change the 200/503 status.
