# Security Policy

## Reporting a Vulnerability

The Lumina team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by emailing:

**security@joinlumina.io**

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., XSS, SQL injection, smart contract bug)
- **Location** of the affected source code (file, line number)
- **Steps to reproduce** the vulnerability
- **Proof of concept** or exploit code (if possible)
- **Impact assessment** of the vulnerability
- **Suggested fix** (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days (depending on severity)

### What to Expect

1. **Acknowledgment**: We'll confirm receipt of your report
2. **Investigation**: Our team will investigate and validate the issue
3. **Updates**: We'll keep you informed of our progress
4. **Resolution**: We'll work on a fix and coordinate disclosure
5. **Credit**: We'll credit you in our security acknowledgments (if desired)

---

## Scope

### In Scope

- Lumina web application (frontend and backend)
- API endpoints
- Authentication and session management
- Smart contract interactions
- Wallet connection flows
- Data storage and privacy

### Out of Scope

- Third-party services we integrate with
- Social engineering attacks
- Physical security
- Denial of service attacks
- Issues in dependencies (report to upstream)

---

## Smart Contract Security

For vulnerabilities in AXIOM Protocol smart contracts, please report to:

**contracts@joinlumina.io**

Smart contract vulnerabilities may be eligible for our bug bounty program.

### Bug Bounty Program

We're launching a bug bounty program soon. Rewards will be based on severity:

| Severity | Reward Range |
|----------|--------------|
| Critical | $5,000 - $25,000 |
| High | $1,000 - $5,000 |
| Medium | $250 - $1,000 |
| Low | $50 - $250 |

*Final amounts determined by impact and quality of report.*

---

## Security Best Practices

### For Users

- **Protect your wallet**: Never share your seed phrase
- **Verify transactions**: Always check transaction details before signing
- **Use hardware wallets**: For significant holdings
- **Enable 2FA**: On your Lumina account
- **Beware of phishing**: Verify URLs and don't click suspicious links

### For Developers

- **Never commit secrets**: Use environment variables
- **Validate all inputs**: Server-side validation is mandatory
- **Use parameterized queries**: Prevent SQL injection
- **Implement rate limiting**: Protect against abuse
- **Follow least privilege**: Minimize access permissions

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < 1.0   | No        |

We only provide security updates for the latest version.

---

## Security Acknowledgments

We thank the following researchers for responsibly disclosing vulnerabilities:

*This section will be updated as we receive and resolve reports.*

---

## Contact

- **Security Issues**: security@joinlumina.io
- **Smart Contracts**: contracts@joinlumina.io
- **General Inquiries**: hello@joinlumina.io

---

Thank you for helping keep Lumina and our users safe!
