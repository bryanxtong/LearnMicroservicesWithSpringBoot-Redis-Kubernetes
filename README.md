# Learn Microservices with Spring Boot 3 - (Spring Cloud and Redis)
This repository contains the source code of the practical use case described in the book [Learn Microservices with Spring Boot 3 (3rd Edition)](https://link.springer.com/book/10.1007/978-1-4842-9757-5).
And I made some changes to add a logback redis appender https://github.com/kmtong/logback-redis-appender and add micrometer zipkin trace support.

## Features

The figure below shows a high-level overview of the final version of our system.

![Logical View - Chapter 8 (Final)](resources/microservice_patterns-Config-Server-1.png)

The main concepts included in this project are:

* Why do we need Centralized Logs and Distributed tracing?
* Why would I create Docker images for my applications?
* Building a simple logger application with Spring Boot and Redis using logback redis appender.
* Event Driven message processing with redis stream for business
* Distributed traces with Micrometer and Zipkin.
* Building Docker images for Spring Boot applications with Cloud Native Buildpacks.
* Container Platforms, Application Platforms, and Cloud Services.

## Running the app

### Building the images yourself

First, build the application images with:

```bash
multiplication$ ./mvnw spring-boot:build-image
gamification$ ./mvnw spring-boot:build-image
gateway$ ./mvnw spring-boot:build-image
logs$ ./mvnw spring-boot:build-image
```

or

```bash
multiplication$ docker build -t  multiplication:0.0.1-SNAPSHOT .
gamification$ docker build -t  gamification:0.0.1-SNAPSHOT .
gateway$ docker build -t  gateway:0.0.1-SNAPSHOT .
logs$ docker build -t  logs:0.0.1-SNAPSHOT .
```

Then, build the consul importer from the `docker/consul` folder:

```bash
$ consul agent -node=learnmicro -dev
docker/consul$ consul kv export config/ > consul-kv-docker.json
docker/consul$ docker build -t consul-importer:1.0 .
```

And the UI server (first you have to build it with `npm run build`):

```bash
challenges-frontend$ npm install
# Build with Docker Compose environment URLs
challenges-frontend$ REACT_APP_API_URL=http://localhost:8000 REACT_APP_KEYCLOAK_URL=http://localhost:8180 npm run build
challenges-frontend$ docker build -t challenges-frontend:1.0 .
```

**Important Note**: React environment variables are build-time only. The frontend image must be built with the correct URLs for the Docker Compose environment:
- `REACT_APP_API_URL=http://localhost:8000` (Gateway direct access)
- `REACT_APP_KEYCLOAK_URL=http://localhost:8180` (Keycloak direct access)

For Kubernetes deployment, rebuild the frontend with different URLs:
```bash
challenges-frontend$ REACT_APP_API_URL=http://localhost/api REACT_APP_KEYCLOAK_URL=http://localhost/auth npm run build
challenges-frontend$ docker build -t challenges-frontend:1.0 .
```

Once you have all the images ready, run:

```bash
docker$ docker-compose up
```

See the figure below for a diagram showing the container view.

![Container View](resources/microservice_patterns-View-Containers.png)

Once the backend and the frontend are started, you can navigate to `http://localhost:3000` in your browser and start resolving multiplication challenges.

### Docker Compose Services

The Docker Compose setup includes:
- **Frontend** (port 3000): React web application
- **Gateway** (port 8000): API Gateway with OAuth2 support
- **Multiplication** (internal): Multiplication challenge service
- **Gamification** (internal): Gamification service
- **Logs** (internal): Centralized log consumer
- **Consul** (port 8500): Service discovery and configuration
- **Redis** (port 6379): Message broker and cache
- **Zipkin** (port 9411): Distributed tracing
- **Keycloak** (port 8180): OAuth2/OIDC authentication server

**Access URLs**:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- Consul UI: http://localhost:8500
- Zipkin UI: http://localhost:9411
- Keycloak: http://localhost:8180

**Authentication**:
- Username: `testuser`
- Password: `testuser`

## Playing with Docker Compose

After the system is up and running, you can quickly scale up and down instances of both Multiplication and Gamification services. For example, you can run:

```bash
docker$ docker-compose up --scale multiplication=2 --scale gamification=2
```

**Note**: Multiplication and Gamification use H2 file databases, so scaling beyond 1 replica may cause data inconsistency. For production use with multiple replicas, migrate to an external database like PostgreSQL.

## Running on Kubernetes

This project includes complete Kubernetes deployment configurations with service discovery (Consul), distributed tracing (Zipkin), centralized logging (Redis), and OAuth2 authentication (Keycloak).

### Prerequisites

- **Kubernetes Cluster**: Kind, Minikube, or any Kubernetes cluster (v1.24+)
- **kubectl**: Kubernetes command-line tool
- **Docker**: For building images
- **Ingress Controller**: Nginx Ingress Controller

### Quick Start with Kind

#### 1. Create a Kind Cluster

```bash
# Create cluster with ingress support
cat <<EOF | kind create cluster --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF
```

#### 2. Install Nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

#### 3. Build Application Images

Build all Docker images with correct versions:

```bash
# Build Java microservices (version: 0.0.1-SNAPSHOT)
cd multiplication && mvn clean package -DskipTests
docker build -t multiplication:0.0.1-SNAPSHOT .

cd ../gamification && mvn clean package -DskipTests
docker build -t gamification:0.0.1-SNAPSHOT .

cd ../gateway && mvn clean package -DskipTests
docker build -t gateway:0.0.1-SNAPSHOT .

cd ../logs && mvn clean package -DskipTests
docker build -t logs:0.0.1-SNAPSHOT .

# Build Frontend (version: 1.0)
cd ../challenges-frontend
npm install
npm run build
docker build -t challenges-frontend:1.0 .

# Build Consul importer (version: 1.0)
cd ../docker/consul
docker build -t consul-importer:1.0 .
```

#### 4. Load Images to Kind

```bash
kind load docker-image multiplication:0.0.1-SNAPSHOT
kind load docker-image gamification:0.0.1-SNAPSHOT
kind load docker-image gateway:0.0.1-SNAPSHOT
kind load docker-image logs:0.0.1-SNAPSHOT
kind load docker-image challenges-frontend:1.0
kind load docker-image consul-importer:1.0
```

#### 5. Deploy to Kubernetes

```bash
# Deploy all services using Kustomize
kubectl apply -k k8s/base/

# Or deploy to specific environment
kubectl apply -k k8s/overlays/dev/
kubectl apply -k k8s/overlays/prod/
```

#### 6. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n microservices

# Check services
kubectl get svc -n microservices

# Check ingress
kubectl get ingress -n microservices
```

### Architecture Overview

The Kubernetes deployment includes:

**Microservices**:
- **Gateway** (2 replicas): API Gateway with OAuth2 Token Relay, port 8000
- **Multiplication** (1 replica): Multiplication challenge service, port 8080
- **Gamification** (1 replica): Gamification and leaderboard service, port 8081
- **Logs** (1 replica): Centralized log consumer, port 8580
- **Frontend** (2 replicas): React web application, port 80

**Infrastructure Services**:
- **Consul** (StatefulSet): Service discovery and distributed configuration
- **Redis** (Deployment + PVC): Message broker (Redis Streams) and log storage
- **Keycloak** (Deployment): OAuth2/OIDC authentication server
- **Zipkin** (Deployment): Distributed tracing system

**Configuration**:
- **Consul Importer** (Job): Automatically imports configuration to Consul KV
- **ConfigMaps**: Keycloak realm configuration, Redis configuration
- **Ingress**: Unified HTTP routing for all services

### Accessing the Application

After deployment, access the services at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost/ | Main web application |
| **API Gateway** | http://localhost/api/ | REST API endpoints |
| **Consul UI** | http://localhost/consul/ | Service registry and config |
| **Keycloak** | http://localhost/auth/ | Authentication admin console |
| **Zipkin** | http://localhost/zipkin/ | Distributed tracing UI |

### Authentication

The system uses Keycloak for OAuth2 authentication:

- **Admin Console**: http://localhost/auth/admin/
  - Username: `admin`
  - Password: `admin`

- **Test User** (for application login):
  - Username: `testuser`
  - Password: `testuser`

### Service Configuration

#### Spring Profiles

Services automatically detect the environment and load appropriate configurations:

- **Default**: Local development (H2 database, localhost connections)
- **Docker**: Docker Compose environment
- **Kubernetes**: Kubernetes cluster (uses POD_IP for service registration)

#### Consul Configuration

Centralized configuration is stored in Consul KV:
- `config/application,docker/`: Docker profile configuration
- `config/application,kubernetes/`: Kubernetes profile configuration

Configuration includes:
- Logging levels
- Spring Cloud settings
- Shared properties across services

#### OAuth2 Configuration

All microservices are secured with OAuth2 JWT:
- **Issuer**: Keycloak at http://localhost/auth/realms/microservices-demo
- **Client**: challenges-app (public client with PKCE)
- **Scopes**: openid
- **Token**: JWT with 5-minute expiration

### Persistent Storage

The following services use Persistent Volume Claims (PVC):

| Service | PVC Name | Size | Purpose |
|---------|----------|------|---------|
| **Consul** | data-consul-0 | 1Gi | Service registry data |
| **Consul** | config-consul-0 | 100Mi | Configuration data |
| **Redis** | redis-pvc | 1Gi | Redis data and logs |

**Note**: Multiplication and Gamification use H2 file databases, so they must run with `replicas: 1` to avoid data inconsistency.

### Scaling Considerations

**Can Scale** (stateless services):
- Gateway: `kubectl scale deployment gateway -n microservices --replicas=3`
- Frontend: `kubectl scale deployment challenges-frontend -n microservices --replicas=3`
- Logs: Can scale with proper Redis Stream consumer groups

**Cannot Scale** (stateful services with local storage):
- Multiplication: Uses H2 file database
- Gamification: Uses H2 file database
- Keycloak: Uses H2 file database (for production, use external database)

**To scale stateful services**, migrate to external databases:
- PostgreSQL for Keycloak
- PostgreSQL/MySQL for Multiplication and Gamification

### Monitoring and Debugging

#### View Logs

```bash
# View logs for a specific service
kubectl logs -f deployment/gateway -n microservices
kubectl logs -f deployment/multiplication -n microservices

# View logs for all pods with a label
kubectl logs -l app=gateway -n microservices --tail=100

# View centralized logs in Redis
kubectl exec -it deployment/redis -n microservices -- redis-cli
> XREAD COUNT 10 STREAMS logs:stream 0
```

#### Check Service Health

```bash
# Check service endpoints
kubectl get endpoints -n microservices

# Check Consul service registration
kubectl port-forward -n microservices svc/consul-ui 8500:8500
# Visit http://localhost:8500/ui/dc1/services

# Check pod status
kubectl describe pod <pod-name> -n microservices
```

#### Distributed Tracing

Access Zipkin UI to view request traces:
1. Open http://localhost/zipkin/
2. Click "Run Query" to see recent traces
3. Click on a trace to see the full request flow across services

### Kubernetes Deployment Structure

```
k8s/
├── base/                          # Base configurations
│   ├── namespace.yaml             # microservices namespace
│   ├── challenges-frontend.yaml   # Frontend deployment + service
│   ├── gateway.yaml               # Gateway deployment + service
│   ├── multiplication.yaml        # Multiplication deployment + service
│   ├── gamification.yaml          # Gamification deployment + service
│   ├── logs.yaml                  # Logs deployment + service
│   ├── consul-statefulset.yaml    # Consul StatefulSet + services
│   ├── consul-importer.yaml       # Consul config importer job
│   ├── redis.yaml                 # Redis deployment + PVC + service
│   ├── keycloak.yaml              # Keycloak deployment + ConfigMap + service
│   ├── zipkin.yaml                # Zipkin deployment + service
│   ├── ingress.yaml               # Ingress rules for all services
│   └── kustomization.yaml         # Kustomize configuration
└── overlays/                      # Environment-specific overlays
    ├── dev/
    │   └── kustomization.yaml     # Development patches
    └── prod/
        └── kustomization.yaml     # Production patches
```

### Environment-Specific Deployment

#### Development Environment

```bash
kubectl apply -k k8s/overlays/dev/
```

Development environment features:
- Reduced resource limits
- Debug logging enabled
- Development-mode services

#### Production Environment

```bash
kubectl apply -k k8s/overlays/prod/
```

Production environment features:
- Higher resource limits
- Production logging levels
- Health checks and probes

### Troubleshooting

#### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n microservices

# Check if images are available
kubectl get pods -n microservices -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n'

# For Kind, ensure images are loaded
kind load docker-image <image-name>:<tag>
```

#### Service Discovery Issues

```bash
# Check Consul registration
kubectl exec -it consul-0 -n microservices -- consul members

# View Consul logs
kubectl logs consul-0 -n microservices

# Check if services registered
kubectl exec -it consul-0 -n microservices -- consul catalog services
```

#### Ingress Not Working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress rules
kubectl describe ingress -n microservices

# Test from inside the cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://gateway.microservices.svc.cluster.local:8000/actuator/health
```

#### Authentication Issues

```bash
# Check Keycloak logs
kubectl logs deployment/keycloak -n microservices

# Verify realm import
kubectl exec -it deployment/keycloak -n microservices -- \
  ls -la /opt/keycloak/data/import/

# Test Keycloak endpoint
curl http://localhost/auth/realms/microservices-demo
```

### Cleanup

To remove all resources:

```bash
# Delete all resources in the namespace
kubectl delete namespace microservices

# Or use Kustomize
kubectl delete -k k8s/base/

# Delete Kind cluster
kind delete cluster
```

### Next Steps

- **Production Readiness**: Replace H2 databases with PostgreSQL
- **High Availability**: Deploy Consul in HA mode (3 nodes)
- **Monitoring**: Add Prometheus and Grafana
- **Service Mesh**: Consider Istio or Linkerd for advanced traffic management
- **GitOps**: Use ArgoCD or Flux for continuous deployment

