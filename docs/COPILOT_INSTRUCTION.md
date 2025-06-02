# COPILOT INSTRUCTION GUIDE

## Development Workflow Instructions

### Package Management

- **ALWAYS use `yarn`** for all package operations
- Use `yarn install`, `yarn add`, `yarn remove`, etc.
- Never use `npm` commands in this project

### Task Completion Workflow

When completing any task or feature implementation:

1. **Complete the implementation** with proper code and testing
2. **Update PROJECT_ROADMAP.md** - Mark completed tasks with ✅ COMPLETED
3. **Update README.md** - Add documentation for new features and capabilities
4. **DO NOT create separate task completion notes** in separate .md files
5. **Use yarn commands** for any build, lint, or test operations
6. **All test must be** inside the /tests directory

### Documentation Updates Required

- **PROJECT_ROADMAP.md**: Update task status and mark as completed
- **README.md**: Add feature documentation, usage instructions, and examples
- Keep documentation current and comprehensive

### Development Commands

- `yarn lint` - Check code quality
- `yarn lint --fix` - Fix linting issues automatically
- `yarn build` - Build the extension (if applicable)
- `yarn test` - Run tests (if applicable)

### File Organization

- Keep all documentation in appropriate files
- No separate completion notes or summary files
- Maintain clean project structure

### Code Quality

- Always run `yarn lint` before completing tasks
- Fix any linting errors or warnings
- Ensure code follows project standards

---

## Previous Context Summary

This project is a Chrome Currency Conversion Extension implementing:

- Context menu currency conversion
- Real-time exchange rates
- Advanced settings and preferences
- Visual feedback and animations
- Performance optimizations with lazy loading
- Comprehensive accessibility features

Current status: Phase 5 Task 5.3 (Accessibility Features) completed.
