
============================================================================================

# 01 — Workload IAM Baseline

============================================================================================


The first layer of the project establishes the IAM architecture inside the **Workload Account** before introducing cross-account access.

An EC2 workload uses an **Instance Profile** to obtain credentials associated with `WorkloadRole`. The role is trusted by the EC2 service and provides the permissions required to access the workload S3 bucket.

```text
┌──────────────────────┐
│    Workload Account  │
│                      │
│  ┌───────────────┐   │
│  │      EC2      │   │
│  └───────┬───────┘   │
│          │           │
│          ▼           │
│  ┌───────────────┐   │
│  │Instance Profile│  │
│  └───────┬───────┘   │
│          │           │
│          ▼           │
│  ┌───────────────┐   │
│  │ WorkloadRole  │   │
│  └───────┬───────┘   │
│          │           │
│     ┌────┴─────┐     │
│     │ Permissions│    │
│     └────┬─────┘     │
│          │           │
│          ▼           │
│  ┌───────────────┐   │
│  │   S3 Bucket   │   │
│  │               │   │
│  │ GetObject     │   │
│  │   → logs/*    │   │
│  │               │   │
│  │ ListBucket    │   │
│  │   → bucket    │   │
│  └───────────────┘   │
└──────────────────────┘
```

### IAM Relationship

The trust relationship allows the **EC2 service** to assume `WorkloadRole`.

The permissions attached to `WorkloadRole` define what the workload can do after assuming the role:

* `s3:GetObject` → restricted to objects under `logs/*`.
* `s3:ListBucket` → allowed on the specific workload S3 bucket.

The permissions are therefore attached to the **IAM role**, while the S3 bucket is the resource being accessed.

### Future Evolution

This architecture represents the initial workload-side IAM baseline.

The next layers of the project will introduce a **Security Account** and evolve this architecture into a cross-account access model.

```text
Current:

EC2 → Instance Profile → WorkloadRole → S3


Future:

Security Account
       │
       │ AssumeRole
       ▼
Workload Account
       │
       ▼
WorkloadRole
       │
       ▼
      S3
```

The cross-account architecture will introduce additional IAM trust and authorization controls while preserving the least-privilege principles established in this initial layer.
