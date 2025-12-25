# Code Workflow Guide

This document outlines the development workflow and best practices for contributing to MakeCents.

---

## 🌿 Branch Strategy

### Main Branches
- `main` - Production-ready code (protected)
- `develop` - Integration branch for features (optional, if using Git Flow)

### Feature Branches
- `feature/description` - New features (e.g., `feature/money-flow-viz`)
- `fix/description` - Bug fixes (e.g., `fix/teller-env-vars`)
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Naming Convention
- Use kebab-case: `feature/add-ai-agents`
- Be descriptive: `fix/teller-application-id-env-var`
- Keep it concise: `feature/goal-automation`

---

## 🔄 Development Workflow

### 1. Starting a New Feature/Bug Fix

```bash
# Update main branch
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b feature/your-feature-name

# Or for bug fixes:
git checkout -b fix/your-bug-description
```

### 2. Making Changes

- **Write code** following the project's style guide
- **Update TODO.md** as you make progress
- **Test your changes** locally
- **Commit frequently** with clear messages

### 3. Committing Changes

#### Commit Message Format

```
type(scope): brief description

Optional longer description explaining what and why
```

#### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples:

```bash
# Good commit messages
git commit -m "fix(teller): use NEXT_PUBLIC_ prefix for application ID env var"
git commit -m "feat(goals): add automatic progress tracking from linked accounts"
git commit -m "docs(setup): update environment variable documentation"

# Bad commit messages
git commit -m "fix stuff"
git commit -m "update"
git commit -m "changes"
```

#### Commit Best Practices:
- ✅ One logical change per commit
- ✅ Write clear, descriptive messages
- ✅ Reference TODO items when relevant
- ✅ Keep commits focused and atomic
- ❌ Don't commit broken code
- ❌ Don't commit large files or dependencies
- ❌ Don't commit sensitive data (.env, API keys)

### 4. Pushing to Remote

```bash
# Push your branch to remote
git push origin feature/your-feature-name

# If branch doesn't exist on remote yet:
git push -u origin feature/your-feature-name
```

### 5. Creating a Pull Request (PR)

1. **Push your branch** to remote
2. **Create PR** on GitHub/GitLab
3. **Fill out PR template**:
   - What changed?
   - Why?
   - How to test?
   - Related TODO items?
4. **Request review** (if working with team)
5. **Address feedback** and update PR
6. **Merge** when approved

---

## 📝 PR Template

When creating a PR, include:

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] Updated tests (if applicable)
- [ ] Manual testing steps:
  1. Step 1
  2. Step 2

## TODO Updates
- [ ] Updated TODO.md (if applicable)
- Related module: Module X

## Screenshots (if UI changes)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guide
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No console.logs left in code
- [ ] No sensitive data committed
```

---

## 🧹 Code Quality

### Before Committing

1. **Run linter**:
   ```bash
   npm run lint
   ```

2. **Check for errors**:
   - Fix TypeScript errors
   - Fix ESLint warnings
   - Remove console.logs (use proper logging)

3. **Test locally**:
   - Start dev server: `npm run dev`
   - Test the feature/fix
   - Check for console errors

4. **Update documentation**:
   - Update TODO.md if needed
   - Update relevant .md files
   - Add code comments for complex logic

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Naming**: Use descriptive names, camelCase for variables/functions
- **Components**: PascalCase for React components
- **Files**: kebab-case for file names
- **Comments**: Explain why, not what
- **Formatting**: Use Prettier (if configured) or consistent formatting

---

## 🔍 Review Process

### Self-Review Checklist

Before requesting review:
- [ ] Code works as expected
- [ ] No TypeScript/ESLint errors
- [ ] Follows project patterns
- [ ] Updated relevant documentation
- [ ] Tested edge cases
- [ ] No sensitive data exposed
- [ ] Performance considered (if applicable)

### Reviewing Others' Code

- Be constructive and respectful
- Ask questions, don't assume
- Suggest improvements, don't just point out problems
- Approve when satisfied
- Request changes with clear explanations

---

## 🚀 Deployment Workflow

### Development
- Work on feature branches
- Test locally
- Create PRs for review

### Staging (if applicable)
- Merge to `develop` branch
- Deploy to staging environment
- Test in staging

### Production
- Merge to `main` branch
- Tag release: `git tag v1.0.0`
- Deploy to production
- Monitor for issues

---

## 📚 Documentation Updates

### When to Update Documentation

- **New features**: Update README.md, ARCHITECTURE.md
- **API changes**: Update API documentation
- **Setup changes**: Update SETUP_GUIDE.md
- **Workflow changes**: Update this file (CODE_WORKFLOW.md)
- **Progress**: Update TODO.md

### Documentation Files

- `README.md` - Project overview, quick start
- `SETUP_GUIDE.md` - Detailed setup instructions
- `ARCHITECTURE.md` - System architecture
- `TODO.md` - Development roadmap and progress
- `CODE_WORKFLOW.md` - This file
- `TECH_STACK.md` - Technology stack details

---

## 🐛 Bug Fix Workflow

1. **Identify bug**: Document in issue or TODO
2. **Create branch**: `fix/bug-description`
3. **Reproduce**: Write steps to reproduce
4. **Fix**: Implement fix
5. **Test**: Verify fix works
6. **Document**: Update relevant docs
7. **Commit**: Use `fix(scope): description` format
8. **PR**: Create PR with bug description and fix

---

## 🔐 Security Best Practices

- **Never commit**:
  - `.env` files
  - API keys
  - Passwords
  - Private keys
  - Certificates

- **Use environment variables** for secrets
- **Add to `.gitignore`**:
  - `.env`
  - `.env.local`
  - `*.pem`
  - `*.key`

- **Review PRs** for sensitive data before merging

---

## 📦 Dependency Management

### Adding Dependencies

```bash
# Install new dependency
npm install package-name

# Install dev dependency
npm install -D package-name

# Update package-lock.json
npm install
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm install package-name@latest

# Update all (be careful!)
npm update
```

### Commit Dependencies

- ✅ Commit `package.json` and `package-lock.json`
- ❌ Don't commit `node_modules/`

---

## 🎯 Agile Practices

### Sprint Planning
- Review TODO.md
- Select tasks for sprint
- Break down large tasks
- Estimate effort

### Daily Standups (if team)
- What did I do?
- What will I do?
- Any blockers?

### Sprint Review
- Demo completed work
- Update TODO.md progress
- Plan next sprint

---

## 📞 Getting Help

### Stuck on Something?

1. **Check documentation**: README, SETUP_GUIDE, TODO.md
2. **Search codebase**: Use grep or codebase search
3. **Check issues**: Look for similar issues
4. **Ask team**: Reach out for help
5. **Document solution**: Update docs for future reference

---

## ✅ Quick Reference

### Common Commands

```bash
# Start development
git checkout main
git pull
git checkout -b feature/my-feature
npm run dev

# Before committing
npm run lint
npm run build  # Check for build errors

# Commit and push
git add .
git commit -m "feat(scope): description"
git push origin feature/my-feature

# Update TODO
# Edit TODO.md, mark completed items
git add TODO.md
git commit -m "docs(todo): update progress on Module X"
```

---

**Remember**: Good code collaboration is about communication, clarity, and respect. Keep commits clean, messages clear, and documentation up to date!

