# Pull Request Template

## What & Why
### What changed?
<!-- Briefly describe what this PR does -->

### Why was this change needed?
<!-- Explain the business/technical reason for this change -->

### Related Issues
<!-- Link to any related issues: Fixes #123, Closes #456 -->

---

## Screenshots
<!-- For UI changes, include before/after screenshots -->
<!-- For API changes, include request/response examples -->

### Before
<!-- Screenshot or code example of current behavior -->

### After
<!-- Screenshot or code example of new behavior -->

---

## Tests
### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if UI changes)
- [ ] Accessibility tests added/updated (if UI changes)

### Test Evidence
<!-- Describe what you tested and how -->
<!-- Include test command outputs if relevant -->

### Manual Testing
- [ ] Tested in development environment
- [ ] Tested accessibility with keyboard navigation
- [ ] Tested accessibility with screen reader
- [ ] Cross-browser testing completed (if UI changes)

---

## Performance Impact
### Expected Impact
- [ ] No performance impact
- [ ] Improves performance
- [ ] May impact performance (explain below)

### Performance Analysis
<!-- For changes that may affect performance -->
- **Bundle size impact**: 
- **Runtime performance**: 
- **Database query impact**: 
- **API response time impact**: 

### Performance Testing
<!-- Include lighthouse scores, bundle analyzer results, etc. -->

---

## Security Considerations
### Security Review
- [ ] No sensitive data exposed
- [ ] Input validation added where needed
- [ ] Authentication/authorization checks in place
- [ ] SQL injection prevention considered
- [ ] XSS prevention considered
- [ ] CSRF protection in place (for state-changing operations)

### Security Impact
<!-- Describe any security implications -->
- **Data handling**: 
- **Authentication changes**: 
- **Authorization changes**: 
- **External dependencies**: 

---

## API Changes Checklist
<!-- Complete this section if your PR includes API changes -->

### Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes documented and versioned
- [ ] Migration guide provided
- [ ] Backward compatibility maintained

### API Documentation
- [ ] API documentation updated
- [ ] OpenAPI/Swagger specs updated
- [ ] Examples provided
- [ ] Error responses documented

### API Testing
- [ ] API contract tests added
- [ ] Error handling tested
- [ ] Rate limiting tested
- [ ] Authentication tested
- [ ] Authorization tested

---

## Deployment Checklist
### Environment Variables
- [ ] No new environment variables
- [ ] New environment variables documented
- [ ] Environment variables added to deployment configs

### Database Changes
- [ ] No database changes
- [ ] Database migrations included
- [ ] Migration rollback tested
- [ ] Database indexes optimized

### Infrastructure
- [ ] No infrastructure changes required
- [ ] Infrastructure changes documented
- [ ] Deployment guide updated

---

## Review Guidelines
### For Reviewers
Please check:
1. **Code Quality**: Clean, readable, follows project conventions
2. **Security**: No security vulnerabilities introduced
3. **Performance**: No unnecessary performance degradation
4. **Testing**: Adequate test coverage for changes
5. **Documentation**: Updated where necessary
6. **Accessibility**: WCAG 2.1 AA compliance maintained (for UI changes)

### Reviewer Checklist
- [ ] Code review completed
- [ ] Security review completed (if applicable)
- [ ] Performance review completed (if applicable)
- [ ] Documentation review completed
- [ ] Test coverage verified