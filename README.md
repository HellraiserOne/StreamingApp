# StreamingApp - Container Orchestration & Scaling on AWS EKS

A 5-service MERN streaming platform (auth, streaming, admin, chat, frontend) containerized with Docker, packaged as a Helm chart, and deployed to a production-style Kubernetes cluster on Amazon EKS - with Ingress routing, MongoDB Atlas, S3-backed media storage, CloudWatch monitoring/logging, and a Jenkins CI pipeline.

## Architecture

```
                              ┌─────────────────────┐
                              │   Ingress (nginx)    │
                              │  streamingapp.local   │
                              └──────────┬───────────┘
                    ┌─────────┬──────────┼──────────┬──────────┐
                    │         │          │          │          │
               frontend    auth-svc  streaming-svc admin-svc chat-svc
                (React)     :3001      :3002       :3003     :3004 + WS
                    │         │          │          │          │
                    └─────────┴──────────┴──────────┴──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
             MongoDB Atlas      Amazon S3      CloudWatch
             (external, TLS)   (video/thumb    (Container
                                  storage)       Insights)
```

- **Frontend**: React SPA served via Nginx, routes API calls by relative path (`/api/auth`, `/api/streaming`, `/api/admin`, `/api/chat`) so it works against any host.
- **Auth service**: mounts its router at `/api` (not `/api/auth`) — the Ingress rewrites `/api/auth/*` → `/api/*` to match.
- **Streaming / Admin / Chat services**: mount routers at `/api/streaming`, `/api/admin`, `/api/chat` respectively — the Ingress passes these through unchanged.
- **Chat** also uses Socket.IO on the default `/socket.io` path, routed to `chat-svc` with extended proxy timeouts for long-lived WebSocket connections.
- **MongoDB**: hosted on MongoDB Atlas (M0 free tier) rather than an in-cluster StatefulSet, to avoid EBS CSI/StorageClass dependencies on EKS.
- **Media storage**: video and thumbnail uploads go through presigned S3 URLs (`datson-s3` bucket, `us-east-1`), issued by the admin/streaming services using AWS SDK credentials passed via a Kubernetes Secret.

## Repository layout

```
streamingapp/
├── backend/                  # authService, streamingService, adminService, chatService
├── frontend/                 # React app + Dockerfile + nginx.conf (SPA fallback)
├── helm-chart/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── auth-deployment.yaml / auth-service.yaml
│       ├── streaming-deployment.yaml / streaming-service.yaml
│       ├── admin-deployment.yaml / admin-service.yaml
│       ├── chat-deployment.yaml / chat-service.yaml
│       ├── frontend-deployment.yaml / frontend-service.yaml
│       ├── configmap.yaml / secret.yaml
│       └── ingress.yaml      # 3 Ingress objects — frontend, api (streaming/admin/chat/socket.io), auth
└── Jenkinsfile
```

## Install / deploy steps

Prerequisites: Docker Desktop, kubectl, Helm 3, AWS CLI, eksctl — all configured against your AWS account and EKS cluster context.

```powershell
# 1. Create the EKS cluster
eksctl create cluster --name streamingapp-cluster --region us-east-1 --nodes 2 --node-type t3.medium

# 2. Install the ingress-nginx controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
kubectl create namespace ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx

# 3. Install the app
helm install streamingapp ./helm-chart `
  --set secrets.jwtSecret="<fixed-random-hex-string>" `
  --set secrets.awsAccessKeyId="<AWS access key with S3 permissions>" `
  --set secrets.awsSecretAccessKey="<AWS secret key>" `
  --set "secrets.mongoUri=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/streamingapp?retryWrites=true&w=majority"

# 4. Map the Ingress LoadBalancer to a local hostname for testing
#    (resolve the ELB hostname to an IP, add to C:\Windows\System32\drivers\etc\hosts)
#    streamingapp.local  <resolved-ip>
```

**Reaching the app**: once installed, browse to `http://streamingapp.local`.

**Updating**: always include `--reuse-values` on subsequent upgrades, or previously-set secrets/tags silently reset to chart defaults:
```powershell
helm upgrade streamingapp ./helm-chart --reuse-values --set services.<service>.tag=<new-tag>
```

## Scaling & rolling updates

```powershell
kubectl scale deploy/streaming-deployment --replicas=4
kubectl rollout status deploy/streaming-deployment

helm upgrade streamingapp ./helm-chart --reuse-values --set services.frontend.tag=<new-tag>
kubectl rollout status deploy/frontend-deployment
```
All Deployments use `RollingUpdate` with `maxUnavailable: 0, maxSurge: 1` for zero-downtime updates.

## Monitoring & logging

- **Metrics & logs**: Amazon CloudWatch Observability EKS add-on (`amazon-cloudwatch-observability`), publishing to the `ContainerInsights` namespace and `/aws/containerinsights/streamingapp-cluster/*` log groups.
- **Alarm**: `streamingapp-high-cpu` (node CPU > 80%, 2 evaluation periods), notifying via SNS topic `streamingapp-alerts` (confirmed email subscription).
- **Required IAM**: the EKS node group role needs `CloudWatchAgentServerPolicy` attached for the agent/fluent-bit pods to authenticate — this is not automatic on an `eksctl`-created nodegroup.

## Screenshots

All screenshots referenced below are included alongside this README in the submission folder.

| File | What it shows |
|---|---|
| `Cluster_state.png` | `kubectl get pods,svc,ingress -A` — full cluster resource state |
| `kubectl pods.png` | All 5 services' pods `Running`, correct replica counts |
| `pods running.png` | Pod health confirmation across a deployment cycle |
| `docker push.png` | Docker image build & push to Docker Hub |
| `Push success.png` | Confirmed image push completion |
| `Version Check.png` | Image tag/version verification on running pods |
| `Jenkins success.png` | Jenkins CI pipeline run, building and pushing images |
| `helm deployed.png` | Initial `helm install` — release deployed successfully |
| `helm upgrade.png` | `helm upgrade` applying chart/config changes |
| `successfully rolled out.png` | Rolling update completing via `kubectl rollout status` — zero downtime |
| `scaling and update.png` | `kubectl scale` increasing replica count live |
| `scale down.png` | Scaling back down after the demo |
| `pod self heal.png` | Manually deleted pod being automatically recreated by the Deployment controller |
| `streaming_app local.png` | Registered user login and browsing the live app via `streamingapp.local` |
| `video upload.png` | Successful video + thumbnail upload through the admin panel (S3-backed) |
| `video playback.png` | Uploaded video streaming/playing back through the catalogue |
| `sns created.png` | SNS topic + confirmed email subscription for CloudWatch alarm notifications |
| `cloudwatch logs.png` | CloudWatch log groups (`application`, `dataplane`, `host`, `performance`) and `ContainerInsights` metrics confirming monitoring pipeline is live |

*(Live chat across two browser tabs was also verified working during testing, using the Socket.IO connection routed via the `/socket.io` Ingress path.)*

## What I'd change for a production deployment

For a real production rollout, I'd add TLS via cert-manager and a real domain instead of a `/etc/hosts` mapping to a self-signed setup; replace manual `kubectl scale` with a HorizontalPodAutoscaler driven by the same CloudWatch CPU metrics already being collected; restrict the MongoDB Atlas network access list to the EKS cluster's NAT gateway IP (or set up VPC peering) instead of allowing `0.0.0.0/0`; scope the S3 bucket policy down to the specific IAM role the pods run as rather than account-wide access; separate environments into distinct namespaces (`dev`/`staging`/`prod`) with per-namespace Helm values; and add a Helm post-render or checksum annotation on the Deployments so ConfigMap/Secret changes trigger automatic pod restarts instead of requiring a manual `kubectl rollout restart`.

## Notable issues resolved during deployment

- **EKS node group creation failures** requiring cluster recreation after a `NodeCreationFailure` from an initial manual nodegroup add.
- **Ingress rewrite mismatches**: each backend service mounts its Express router at a different prefix (`/api`, `/api/streaming`, `/api/admin`, `/api/chat`), requiring per-service Ingress rules rather than one uniform rewrite rule.
- **Frontend build-time env var bug**: an empty-string environment variable (used intentionally to mean "same-origin") was being incorrectly replaced with a hardcoded `localhost` fallback, breaking video/chat connections until the fallback logic was corrected.
- **SPA routing**: the frontend's Nginx config needed a `try_files` fallback to `index.html`, and the `COPY` for that config was initially placed in the wrong Docker build stage.
- **S3 permissions**: uploads required an explicit IAM policy granting `s3:PutObject`/`GetObject`/`DeleteObject` on the bucket, plus an Ingress body-size override to accept file uploads larger than nginx's 1MB default.
- **CloudWatch IAM**: the EKS node role needed `CloudWatchAgentServerPolicy` attached before the observability add-on's agents could authenticate and publish metrics/logs.
