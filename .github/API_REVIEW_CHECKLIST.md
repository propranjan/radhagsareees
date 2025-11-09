# API Review Checklist

This checklist should be used by reviewers when reviewing pull requests that contain API changes. Copy and paste the relevant sections into your review comments.

## 🔍 Quick API Change Detection
Look for changes in:
- `/apps/*/src/app/api/` directories
- Files with API route handlers (`route.ts`, `page.ts` in app directory)
- Middleware files (`middleware.ts`)
- Database schema changes (`schema.prisma`)
- Types in `/src/types/` that affect API contracts

## ✅ API Review Checklist

### 🏗️ Design & Architecture
- [ ] **RESTful Design**: Follows REST principles (proper HTTP methods, resource naming)
- [ ] **Consistent Naming**: Uses consistent naming conventions with existing APIs
- [ ] **Versioning**: Proper API versioning strategy if breaking changes
- [ ] **Error Handling**: Consistent error response format
- [ ] **Status Codes**: Appropriate HTTP status codes used

### 🔒 Security Review
- [ ] **Authentication**: Proper authentication checks in place
- [ ] **Authorization**: Role-based access control implemented
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Rate Limiting**: Rate limiting applied where appropriate
- [ ] **CORS**: Cross-origin policies configured correctly
- [ ] **SQL Injection**: Protected against SQL injection attacks
- [ ] **XSS Protection**: Protected against cross-site scripting
- [ ] **Sensitive Data**: No sensitive data logged or exposed

### 📊 Data & Performance
- [ ] **Database Queries**: Efficient database queries (no N+1 problems)
- [ ] **Pagination**: Pagination implemented for list endpoints
- [ ] **Caching**: Appropriate caching strategy
- [ ] **Response Size**: Response payloads are reasonable size
- [ ] **Database Indexes**: Required indexes present for new queries

### 🧪 Testing & Documentation
- [ ] **Unit Tests**: Unit tests cover new/modified endpoints
- [ ] **Integration Tests**: Integration tests for API workflows
- [ ] **Error Scenarios**: Error scenarios properly tested
- [ ] **API Documentation**: API documentation updated (OpenAPI/Swagger)
- [ ] **Examples**: Request/response examples provided

### 🔄 Backward Compatibility
- [ ] **Breaking Changes**: Breaking changes properly versioned
- [ ] **Migration Guide**: Migration guide provided for breaking changes
- [ ] **Deprecation**: Deprecated endpoints marked with sunset headers
- [ ] **Client Impact**: Impact on existing clients considered

## 🚨 Critical API Changes (Require Extra Review)

If any of these apply, request review from @radhagsareees/core-team:

- [ ] **New Authentication/Authorization Logic**
- [ ] **Database Schema Changes**
- [ ] **External Service Integration**
- [ ] **Payment/Billing Related Changes**
- [ ] **User Data Handling Changes**
- [ ] **Admin/Privileged Operations**

## 📋 Review Comment Templates

### ✅ Approval Template
```markdown
## API Review: ✅ APPROVED

### Security Review
- [x] Authentication/authorization properly implemented
- [x] Input validation in place
- [x] No security vulnerabilities identified

### Performance Review  
- [x] Database queries optimized
- [x] Response times acceptable
- [x] Caching strategy appropriate

### Documentation
- [x] API documentation updated
- [x] Examples provided

**Overall Assessment**: This API change follows best practices and is ready for deployment.
```

### ⚠️ Needs Changes Template
```markdown
## API Review: ⚠️ CHANGES REQUESTED

### Security Concerns
- [ ] Issue: [Describe security issue]
- [ ] Recommendation: [Provide solution]

### Performance Concerns
- [ ] Issue: [Describe performance issue]  
- [ ] Recommendation: [Provide solution]

### Documentation Gaps
- [ ] Missing: [What documentation is needed]

**Next Steps**: Please address the above concerns and request re-review.
```

### 🔍 Questions Template
```markdown
## API Review: 🔍 QUESTIONS

### Design Questions
1. **Question**: [Your question about API design]
   **Context**: [Why you're asking]

2. **Question**: [Another question]
   **Context**: [Context for the question]

### Security Questions
1. **Question**: [Security-related question]
   **Risk**: [Potential risk if not addressed]

**Status**: Awaiting clarification before approval.
```

## 🎯 Focus Areas by Change Type

### New Endpoints
- Authentication/authorization implementation
- Input validation completeness
- Error handling consistency
- Documentation completeness

### Modified Endpoints
- Backward compatibility impact
- Breaking change documentation
- Client migration requirements
- Test coverage for changes

### Database Changes
- Migration safety (rollback plan)
- Index performance impact
- Data integrity constraints
- Backup requirements

### Authentication/Authorization Changes
- Security model consistency
- Privilege escalation prevention  
- Token handling security
- Session management