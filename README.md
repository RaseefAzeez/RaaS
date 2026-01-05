🎯 **Project Goal**

**RaaS- Reboot As A Service** - Simple, Secure EC2 Management — List, Check, and Reboot! 
Reduce operational overhead caused by repetitive EC2 reboot and connectivity tickets by enabling a secure, policy-driven self-service solution.

🧩 **Solution Overview**

**RaaS** provides a web-based interface backed by a serverless AWS architecture.
Authentication is handled using Amazon Cognito, while authorization is enforced using a combination of RBAC and ABAC implemented in AWS Lambda. Access decisions are dynamically derived from Cognito group claims and EC2 instance tags, ensuring least-privilege access at scale.

**Architecture Overview**

**Frontend**: Static web application hosted on Amazon S3 and delivered securely over HTTPS via Amazon CloudFront

**Authentication**: OAuth2-based login using Amazon Cognito (Hosted UI + JWT tokens)

**API Layer**: Amazon API Gateway (HTTP API) with JWT authorizers

**Backend Logic**: AWS Lambda for request handling, authorization checks, and EC2 operations

**Authorization Model:**

RBAC: Cognito user groups
ABAC: EC2 instance tags (OwnerGroup)
Infrastructure as Code: Terraform
CI/CD: GitHub Actions with OIDC-based authentication (no static AWS keys)

🔐 **Security Model**

No AWS credentials or Console access exposed to end users
OAuth2 and JWT-based authentication
Fine-grained authorization using RBAC + ABAC
IAM roles scoped with least-privilege permissions
All actions logged via CloudWatch for auditability

✨ **Key Features**

Secure, self-service EC2 reboot capability
OAuth2 authentication with Amazon Cognito
RBAC and ABAC enforced using Cognito groups and EC2 tags
Serverless backend using API Gateway and AWS Lambda
HTTPS-enabled frontend via CloudFront and S3
Automated infrastructure and deployments using Terraform and GitHub Actions

🛠️ **Technologies Used**

AWS Services: AWS Amplify, S3, API Gateway, Lambda, DynamoDB, SNS, CloudFormation, IAM, CloudWatch
CI/CD and IaC: GitHub Actions, GitHub workflow and Cloud Formation
Version Control: Git, GitHub
Frontend: HTML, Tailwind CSS, JavaScript

📂 **Repository Structure**

<img width="1024" height="1536" alt="RaaS - folder structure" src="https://github.com/user-attachments/assets/8ca63887-f185-4958-9568-7f99c0fc4195" />



🧠 **Key Learnings**

IAM Identity Center is not suitable for web-based JWT authorizers with API Gateway

Amazon Cognito provides a clean OAuth2 and JWT flow for web applications

Combining RBAC and ABAC enables scalable, policy-driven access control

CloudFront is required to provide HTTPS for S3-hosted applications using Cognito

Real-world DevOps projects involve troubleshooting beyond tutorials, including JWT mismatches, CORS issues, CloudFront integration quirks, and Terraform edge cases

🚀 #Future Enhancements

Multi-account and multi-region EC2 support

Automated group creation and dynamic role mapping

Automatic EC2 tagging to eliminate manual ownership configuration

Approval-based workflows for sensitive operations

Scheduled and automated reboot operations

Enhanced audit logging and monitoring dashboards

Custom domain support using ACM and Route 53

📌 **Why This Project Matters**

RaaS reflects real enterprise DevOps architecture, focusing on:
-Security-first design

-Least-privilege access

-Serverless automation

-Scalable authorization models

-Infrastructure as Code and modern CI/CD practices
