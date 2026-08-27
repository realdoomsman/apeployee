# Contributing to Apeployee

Thank you for your interest in contributing to Apeployee! This document provides guidelines and instructions for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**When filing a bug report, include:**
- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots if applicable
- Environment details (OS, Node.js version, etc.)
- Browser version (for frontend issues)

**Bug Report Template:**
```markdown
**Description**
A brief description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., Windows 11, macOS Sonoma]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome 120]
- Phantom wallet version: [e.g., v2023.12.7]

**Additional Context**
Any other relevant information.
```

### Suggesting Enhancements

We welcome feature suggestions! Please:

1. Check if the feature has already been requested
2. Provide a clear description of the feature
3. Explain why the feature would be useful
4. Consider potential implementation approaches

**Feature Request Template:**
```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

### Pull Requests

We accept pull requests for:
- Bug fixes
- New features
- Documentation improvements
- Performance enhancements
- Code refactoring

**Before submitting a PR:**
1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes with clear messages
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a pull request

**PR Title Format:**
- `feat: add new feature`
- `fix: resolve bug description`
- `docs: update documentation`
- `refactor: improve code structure`
- `test: add test coverage`
- `chore: maintenance tasks`

## 🏗️ Development Setup

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/Apeployed.git
cd Apeployed
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Smart Contract
cd ../programs
npm install
```

### 3. Set Up Development Environment

**Backend:**
```bash
cd ../backend
cp .env.example .env
# Edit .env with your configuration
npx prisma migrate dev
npx prisma generate
node server.js
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Smart contract tests
cd ..
anchor test
```

## 📝 Code Style Guidelines

### JavaScript/TypeScript
- Use 2 spaces for indentation
- Use single quotes for strings
- Use const/let, avoid var
- Use arrow functions for callbacks
- Add JSDoc comments for functions
- Follow ESLint rules

### React
- Use functional components with hooks
- Prop types or TypeScript interfaces
- Destructure props
- Use meaningful component names
- Keep components focused and small

### Solana/Anchor
- Follow Anchor naming conventions
- Use clear instruction names
- Add comments for complex logic
- Handle errors appropriately
- Use PDAs for account management

### CSS/Tailwind
- Use Tailwind utility classes
- Custom CSS in separate files
- Responsive design (mobile-first)
- Semantic HTML structure

## 🧪 Testing

### Writing Tests

**Backend (Jest):**
```javascript
describe('API Endpoints', () => {
  test('should connect wallet', async () => {
    const response = await request(app)
      .post('/api/auth/wallet')
      .send({ walletAddress: 'test_wallet_address' });
    expect(response.status).toBe(200);
  });
});
```

**Frontend (Vitest):**
```typescript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders connect wallet button', () => {
  render(<App />);
  const button = screen.getByText(/connect wallet/i);
  expect(button).toBeInTheDocument();
});
```

**Smart Contract (Anchor):**
```rust
#[test]
fn test_initialize_vault() {
    let mut ctx = test_context();
    let ctx = ctx.with_bumps(HashMap::from([(bumps::vault, 1)]));
    initialize_vault(ctx.accounts, authority).unwrap();
}
```

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 📚 Documentation

### Code Comments
- Add comments for complex logic
- Explain WHY, not WHAT
- Keep comments up-to-date
- Use JSDoc for functions

### README Updates
When adding features, update:
- README.md (main documentation)
- QUICKSTART.md (if it affects setup)
- DEPLOYMENT.md (if it affects deployment)

### Commit Messages
Follow conventional commits:
```
feat: add user profile page
fix: resolve wallet connection issue
docs: update API documentation
refactor: simplify payment logic
test: add integration tests
chore: update dependencies
```

## 🎯 Feature Development

### Before Starting
1. Check if the feature is already planned
2. Open an issue to discuss the approach
3. Get approval from maintainers

### During Development
1. Write tests first (TDD approach)
2. Implement the feature
3. Update documentation
4. Test thoroughly

### Before Submitting
1. All tests pass
2. Code follows style guidelines
3. Documentation is updated
4. No console warnings/errors
5. Responsive design works

## 🚀 Release Process

### Versioning
We follow Semantic Versioning:
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number updated
- [ ] Git tag created
- [ ] Deployed to production

## 🌐 Localization

We welcome translations! To add a new language:

1. Create `src/locales/<lang>.json`
2. Translate all strings
3. Update `src/i18n/config.ts`
4. Test the translation
5. Submit a PR

## 🔒 Security

If you find a security vulnerability:
1. Do not open a public issue
2. Email security@apeployed.com
3. Include details and reproduction steps
4. We'll respond and fix it promptly

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor NFT badges
- Invited to contributor Discord channel

## 📞 Getting Help

- **Discord**: Join our server for real-time help
- **GitHub Issues**: For bug reports and feature requests
- **Email**: dev@apeployed.com

## 🎉 Thank You!

We appreciate every contribution, no matter how small. Together, we're building the future of memecoin employment!

---

**Remember: The market is rough. People need work. We're hiring.** 🦍💰
