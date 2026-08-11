# Deep Payslip Templates API Test Cases — 100+ Tests

## Payslip Templates CRUD

### Create Template
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D001 | Create template with name, description, layout_json | POST | `/api/payslip-templates` | 201, template created | Admin |
| PT-D002 | Create template with just name (minimum fields) | POST | `/api/payslip-templates` | 201, default layout used | Admin |
| PT-D003 | Create template with is_default=true (first default) | POST | `/api/payslip-templates` | 201, is_default=true | Admin |
| PT-D004 | Create template with is_default=true when another default exists | POST | `/api/payslip-templates` | 201, old default unset, new is default | Admin |
| PT-D005 | Create template with no name (missing required) | POST | `/api/payslip-templates` | 400, ValidationError | Admin |
| PT-D006 | Create template with name=empty string | POST | `/api/payslip-templates` | 400, ValidationError | Admin |
| PT-D007 | Create template with name=null | POST | `/api/payslip-templates` | 400, ValidationError | Admin |
| PT-D008 | Create template with name as number | POST | `/api/payslip-templates` | 201, name coerced to string | Admin |
| PT-D009 | Create template with very long name (500 chars) | POST | `/api/payslip-templates` | 201, name truncated or saved | Admin |
| PT-D010 | Create template with complex layout_json (full design) | POST | `/api/payslip-templates` | 201, JSONB stored correctly | Admin |
| PT-D011 | Create template with invalid JSON in layout_json | POST | `/api/payslip-templates` | 500 or 201 (depends on validation) | Admin |
| PT-D012 | Create template with layout_json = null | POST | `/api/payslip-templates` | 201, stored as empty JSONB | Admin |
| PT-D013 | Create template with layout_json = {colors: {}} | POST | `/api/payslip-templates` | 201, colors saved | Admin |
| PT-D014 | Create template with layout_json including all section types | POST | `/api/payslip-templates` | 201, all sections stored | Admin |
| PT-D015 | Create template as manager | POST | `/api/payslip-templates` | 403 Forbidden | Manager |
| PT-D016 | Create template as employee | POST | `/api/payslip-templates` | 403 Forbidden | Employee |
| PT-D017 | Create template without auth | POST | `/api/payslip-templates` | 401 Unauthorized | None |
| PT-D018 | Create template with XSS in name | POST | `/api/payslip-templates` | 201, stored as literal text | Admin |
| PT-D019 | Create template with SQL injection in description | POST | `/api/payslip-templates` | 201, parameterized safe | Admin |
| PT-D020 | Create template triggers audit log | POST | `/api/payslip-templates` | 201, audit_log has CREATE_PAYSLIP_TEMPLATE | Admin |
| PT-D021 | Create template returns standard envelope | POST | `/api/payslip-templates` | 201, `{ success, message, data }` | Admin |
| PT-D022 | Create response includes template_id, timestamps | POST | `/api/payslip-templates` | 201, data.template_id, data.created_at present | Admin |
| PT-D023 | Create template with created_by = current user | POST | `/api/payslip-templates` | 201, data.created_by = req.user.userId | Admin |

### List Templates
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D024 | List all templates (no filter) | GET | `/api/payslip-templates` | 200, templates array | Admin |
| PT-D025 | List templates with is_active=true | GET | `/api/payslip-templates?is_active=true` | 200, only active | Admin |
| PT-D026 | List templates with is_active=false | GET | `/api/payslip-templates?is_active=false` | 200, only inactive | Admin |
| PT-D027 | List templates with is_active=invalid | GET | `/api/payslip-templates?is_active=xyz` | 200, acts as false | Admin |
| PT-D028 | List templates sorted by is_default DESC, created_at DESC | GET | `/api/payslip-templates` | 200, default template first | Admin |
| PT-D029 | List templates as manager | GET | `/api/payslip-templates` | 200, full list | Manager |
| PT-D030 | List templates as employee | GET | `/api/payslip-templates` | 403 Forbidden | Employee |
| PT-D031 | List templates without auth | GET | `/api/payslip-templates` | 401 Unauthorized | None |
| PT-D032 | List templates when none exist | GET | `/api/payslip-templates` | 200, empty array | Admin |
| PT-D033 | List templates: verify layout_json is JSON, not string | GET | `/api/payslip-templates` | 200, data[0].layout_json is object | Admin |

### Get Template By ID
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D034 | Get template by valid ID | GET | `/api/payslip-templates/:id` | 200, template detail with layout_json | Admin |
| PT-D035 | Get template by non-existent ID | GET | `/api/payslip-templates/999999` | 404, NotFoundError | Admin |
| PT-D036 | Get template by string ID | GET | `/api/payslip-templates/abc` | 500 or 404 | Admin |
| PT-D037 | Get template as manager | GET | `/api/payslip-templates/:id` | 200, full detail | Manager |
| PT-D038 | Get template as employee | GET | `/api/payslip-templates/:id` | 200, readable | Employee |
| PT-D039 | Get template without auth | GET | `/api/payslip-templates/:id` | 401 Unauthorized | None |
| PT-D040 | Get template response includes is_default, is_active | GET | `/api/payslip-templates/:id` | 200, boolean fields present | Admin |

### Update Template
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D041 | Update template name only | PUT | `/api/payslip-templates/:id` | 200, name updated | Admin |
| PT-D042 | Update template description only | PUT | `/api/payslip-templates/:id` | 200, description updated | Admin |
| PT-D043 | Update template layout_json only | PUT | `/api/payslip-templates/:id` | 200, layout_json replaced | Admin |
| PT-D044 | Update template is_active only | PUT | `/api/payslip-templates/:id` | 200, is_active toggled | Admin |
| PT-D045 | Update template all fields simultaneously | PUT | `/api/payslip-templates/:id` | 200, all updated | Admin |
| PT-D046 | Update with null name (should not replace) | PUT | `/api/payslip-templates/:id` | 200, name unchanged | Admin |
| PT-D047 | Update with empty description (set to empty) | PUT | `/api/payslip-templates/:id` | 200, description = empty string | Admin |
| PT-D048 | Update non-existent template | PUT | `/api/payslip-templates/999999` | 404, NotFoundError | Admin |
| PT-D049 | Update as manager | PUT | `/api/payslip-templates/:id` | 403 Forbidden | Manager |
| PT-D050 | Update without auth | PUT | `/api/payslip-templates/:id` | 401 Unauthorized | None |
| PT-D051 | Update triggers audit log | PUT | `/api/payslip-templates/:id` | 200, audit_log has UPDATE_PAYSLIP_TEMPLATE | Admin |
| PT-D052 | Update returns updated row | PUT | `/api/payslip-templates/:id` | 200, data has new values | Admin |
| PT-D053 | Update layout_json with invalid structure | PUT | `/api/payslip-templates/:id` | 200, stored as-is | Admin |

### Set Default Template
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D054 | Set template as default (no existing default) | PUT | `/api/payslip-templates/:id/set-default` | 200, is_default=true | Admin |
| PT-D055 | Set different template as default (swap) | PUT | `/api/payslip-templates/:id/set-default` | 200, old default=false, new=true | Admin |
| PT-D056 | Set already-default template again | PUT | `/api/payslip-templates/:id/set-default` | 200, idempotent | Admin |
| PT-D057 | Set non-existent template as default | PUT | `/api/payslip-templates/999999/set-default` | 404, NotFoundError | Admin |
| PT-D058 | Set default as manager | PUT | `/api/payslip-templates/:id/set-default` | 403 Forbidden | Manager |
| PT-D059 | Set default as employee | PUT | `/api/payslip-templates/:id/set-default` | 403 Forbidden | Employee |
| PT-D060 | Set default without auth | PUT | `/api/payslip-templates/:id/set-default` | 401 Unauthorized | None |
| PT-D061 | Set default triggers audit log | PUT | `/api/payslip-templates/:id/set-default` | 200, audit_log has SET_DEFAULT_TEMPLATE | Admin |
| PT-D062 | Verify only one default exists after swap | PUT then GET | two templates | Only one has is_default=true | Admin |
| PT-D063 | Set default on inactive template (is_active=false) | PUT | `/api/payslip-templates/:id/set-default` | 200, default set despite inactive | Admin |

### Delete Template
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D064 | Delete existing template | DELETE | `/api/payslip-templates/:id` | 200, deleted | Admin |
| PT-D065 | Delete template and verify gone | DELETE then GET | 200, then 404 | Admin |
| PT-D066 | Delete non-existent template | DELETE | `/api/payslip-templates/999999` | 404, NotFoundError | Admin |
| PT-D067 | Delete default template (should succeed) | DELETE | `/api/payslip-templates/:id` | 200, default template deleted | Admin |
| PT-D068 | Verify after deleting default, no default remains | DELETE then GET | remaining, no is_default=true | Admin |
| PT-D069 | Delete as manager | DELETE | `/api/payslip-templates/:id` | 403 Forbidden | Manager |
| PT-D070 | Delete as employee | DELETE | `/api/payslip-templates/:id` | 403 Forbidden | Employee |
| PT-D071 | Delete without auth | DELETE | `/api/payslip-templates/:id` | 401 Unauthorized | None |
| PT-D072 | Delete triggers audit log | DELETE | `/api/payslip-templates/:id` | 200, audit_log has DELETE_PAYSLIP_TEMPLATE | Admin |
| PT-D073 | Delete returns deleted template data | DELETE | `/api/payslip-templates/:id` | 200, data has deleted row | Admin |

### Preview Template
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D074 | Preview template with valid ID (no employee_id) | GET | `/api/payslip-templates/:id/preview` | 200, PDF binary | Admin |
| PT-D075 | Preview template with specific employee_id | GET | `/api/payslip-templates/:id/preview?employee_id=X` | 200, PDF for that employee | Admin |
| PT-D076 | Preview with non-existent template ID | GET | `/api/payslip-templates/999999/preview` | 404, NotFoundError | Admin |
| PT-D077 | Preview with non-existent employee_id | GET | `/api/payslip-templates/:id/preview?employee_id=999999` | 404, not found | Admin |
| PT-D078 | Preview when no employees exist (empty DB) | GET | `/api/payslip-templates/:id/preview` | 404, no employees available | Admin |
| PT-D079 | Preview as manager | GET | `/api/payslip-templates/:id/preview` | 200, PDF allowed | Manager |
| PT-D080 | Preview as employee | GET | `/api/payslip-templates/:id/preview` | 403 Forbidden | Employee |
| PT-D081 | Preview without auth | GET | `/api/payslip-templates/:id/preview` | 401 Unauthorized | None |
| PT-D082 | Preview response Content-Type is application/pdf | GET | `/api/payslip-templates/:id/preview` | 200, Content-Type header = application/pdf | Admin |
| PT-D083 | Preview response Content-Disposition is inline | GET | `/api/payslip-templates/:id/preview` | 200, Content-Disposition = inline; filename=preview.pdf | Admin |
| PT-D084 | Preview PDF is valid (non-empty, starts with %PDF) | GET | `/api/payslip-templates/:id/preview` | 200, first bytes = `%PDF` | Admin |
| PT-D085 | Preview with template having custom colors in layout | GET | `/api/payslip-templates/:id/preview` | 200, PDF uses custom colors | Admin |
| PT-D086 | Preview with template having custom logo position | GET | `/api/payslip-templates/:id/preview` | 200, PDF reflects layout | Admin |
| PT-D087 | Preview with template having hidden sections | GET | `/api/payslip-templates/:id/preview` | 200, hidden sections excluded | Admin |
| PT-D088 | Preview with tenant-isolated data | GET | `/api/payslip-templates/:id/preview` | 200, uses tenant's employees | Admin |

### Template with Payslip Generation Integration
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D089 | Generate payslip with default template | POST | `/api/payslips/generate` | 201, PDF uses default template layout | Admin |
| PT-D090 | Generate payslip when no template exists | POST | `/api/payslips/generate` | 201, falls back to basic format | Admin |
| PT-D091 | Preview uses first employee when none specified | GET | `/api/payslip-templates/:id/preview` | 200, works with any employee | Admin |
| PT-D092 | Template preview with Unicode in employee name | GET | `/api/payslip-templates/:id/preview?employee_id=X` | 200, PDF renders Unicode | Admin |
| PT-D093 | Template preview with very long employee name | GET | `/api/payslip-templates/:id/preview?employee_id=X` | 200, name truncated in PDF | Admin |
| PT-D094 | Template preview with zero salary employee | GET | `/api/payslip-templates/:id/preview?employee_id=X` | 200, salary shows 0.00 | Admin |

### Edge Cases & Error Scenarios
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-D095 | Create then immediately set as default | POST then PUT | Chained | Works | Admin |
| PT-D096 | Create 50 templates (bulk) | POST × 50 | All 201 | Admin |
| PT-D097 | List with 50 templates sorted correctly | GET | 200, default first, then newest | Admin |
| PT-D098 | Delete all templates, then create new | DELETE all, POST one | 200, works clean | Admin |
| PT-D099 | Template JSONB stores nested objects deeply | POST with deep JSON | 201, preserved | Admin |
| PT-D100 | Template JSONB stores arrays | POST with array fields | 201, preserved | Admin |
| PT-D101 | Cross-tenant: Tenant A templates not visible to Tenant B | GET cross-tenant | empty or different list | Admin |
| PT-D102 | Preview with template having missing employee fields | GET preview | 200, null-safe rendering | Admin |
| PT-D103 | Template update with SQL injection in description | PUT | 200, safely parameterized | Admin |
| PT-D104 | Default template: toggle active/inactive | PUT is_active then GET | toggle works | Admin |
| PT-D105 | Template with all optional fields null | POST with minimal body | 201, defaults used | Admin |

## Summary
- **Create Template**: 23 tests (PT-D001 to PT-D023)
- **List Templates**: 10 tests (PT-D024 to PT-D033)
- **Get Template**: 8 tests (PT-D034 to PT-D040, includes cross-tenant)
- **Update Template**: 13 tests (PT-D041 to PT-D053)
- **Set Default Template**: 10 tests (PT-D054 to PT-D063)
- **Delete Template**: 10 tests (PT-D064 to PT-D073)
- **Preview Template**: 15 tests (PT-D074 to PT-D088)
- **Integration**: 6 tests (PT-D089 to PT-D094)
- **Edge Cases**: 12 tests (PT-D095 to PT-D105, includes edge, error, security)
- **Total**: **107 test cases**
