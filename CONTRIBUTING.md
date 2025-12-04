# Contributing to Lumina

Thank you for your interest in contributing to Lumina! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome newcomers and help them get started
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Professional**: Keep discussions focused and productive

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Git
- A code editor (VS Code recommended)

### Setting Up Your Development Environment

1. **Fork the repository**
   
   Click the "Fork" button on the GitHub repository page.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Lumina.git
   cd Lumina
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/AxiomProtocol/Lumina.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

6. **Set up the database**
   ```bash
   npm run db:push
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

---

## Development Process

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

---

## Pull Request Process

1. **Ensure your code follows our standards** (see Coding Standards below)

2. **Write meaningful commit messages**
   ```
   feat: add user profile page
   fix: resolve wallet connection issue
   docs: update API documentation
   refactor: simplify authentication flow
   ```

3. **Update documentation** if you've changed APIs or added features

4. **Test your changes** thoroughly before submitting

5. **Create the Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Provide a detailed description of changes
   - Include screenshots for UI changes

6. **Respond to feedback** from reviewers promptly

### PR Checklist

- [ ] Code follows project coding standards
- [ ] All tests pass
- [ ] Documentation updated (if applicable)
- [ ] No console.log statements left in code
- [ ] No hardcoded secrets or API keys
- [ ] Responsive design tested (if UI changes)
- [ ] Web3 functionality tested with wallet

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define types explicitly, avoid `any`
- Use interfaces for object shapes
- Use enums for fixed sets of values

```typescript
// Good
interface User {
  id: string;
  username: string;
  walletAddress?: string;
}

// Avoid
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use descriptive prop names
- Add `data-testid` attributes for interactive elements

```typescript
// Good
export function UserProfile({ user, onEdit }: UserProfileProps) {
  return (
    <Card>
      <h2 data-testid="text-username">{user.username}</h2>
      <Button onClick={onEdit} data-testid="button-edit-profile">
        Edit Profile
      </Button>
    </Card>
  );
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow the design system in `design_guidelines.md`
- Use shadcn/ui components when available
- Support dark mode with appropriate variants

### File Organization

- One component per file (unless tightly coupled)
- Group related files in directories
- Use index files for clean exports
- Keep files under 300 lines when possible

### Naming Conventions

- **Files**: `kebab-case.tsx` or `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

---

## Reporting Bugs

### Before Submitting

- Check existing issues to avoid duplicates
- Try to reproduce the bug consistently
- Gather relevant information (browser, OS, wallet)

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Wallet: [e.g., MetaMask 11.0]
```

---

## Feature Requests

We love hearing ideas for new features! Before submitting:

- Check if the feature has already been requested
- Consider if it aligns with the project's goals
- Think about implementation complexity

### Feature Request Template

```markdown
**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How do you envision this working?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Any other relevant information.
```

---

## Questions?

- Open a GitHub Discussion for general questions
- Join our [Discord](https://discord.gg/joinlumina) for community support
- Email developers@joinlumina.io for sensitive matters

---

Thank you for contributing to Lumina! Together, we're building the future of decentralized social media.
