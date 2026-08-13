---
name: playbook-k8s-logs
description: Read-only Kubernetes log query patterns with namespace and pod correlation.
---

# Playbook: Kubernetes Logs

Read-only K8s log investigation for **inv-log-rca**.

## Access modes

| Mode | Behavior |
|------|----------|
| `manual` | Emit `kubectl logs` commands; user pastes output |
| `mcp` | Read-only K8s MCP (logs/list only) |
| `cli` | Wrapper with kubeconfig via env |

No kubeconfig contents in agent files.

## Read-only constraints

- `kubectl logs`, `kubectl get pods`, `kubectl describe pod` — no delete/apply/scale
- Scope to namespaces from profile when known

## Correlation

- Pod labels: `app`, `version`, `trace_id`
- Container timestamps vs app log timestamps (timezone skew)
- Cross-reference with service mesh / ingress request ids from profile

## Query patterns

```bash
# Recent errors for deployment
kubectl logs -n <namespace> deploy/<name> --since=1h | findstr /i error

# Previous crashed instance
kubectl logs -n <namespace> <pod> --previous --tail=200
```

(Use `grep` on Unix hosts.)

## Secret redaction (FR-030)

Redact bearer tokens, cert data, env var dumps per `.investigator/redaction-rules.md`.

## Memory

Lessons → `.investigator/playbook-memory/k8s-logs.md`.
