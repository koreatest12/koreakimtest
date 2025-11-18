#!/bin/bash
# Validation script for dependency-check workflow

set -e

WORKFLOW_FILE=".github/workflows/dependency-check.yml"

echo "========================================"
echo "Dependency Check Workflow Validator"
echo "========================================"
echo ""

# Check file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ Workflow file not found: $WORKFLOW_FILE"
    exit 1
fi
echo "✅ Workflow file exists"

# Check YAML syntax
if python3 -c "import yaml; yaml.safe_load(open('$WORKFLOW_FILE'))" 2>/dev/null; then
    echo "✅ YAML syntax is valid"
else
    echo "❌ YAML syntax is invalid"
    exit 1
fi

# Check file size
SIZE=$(wc -c < "$WORKFLOW_FILE")
LINES=$(wc -l < "$WORKFLOW_FILE")
echo "✅ File size: $SIZE bytes, $LINES lines"

# Check for required jobs
REQUIRED_JOBS=(
    "infrastructure-provisioning"
    "branch-management"
    "node-security"
    "python-security"
    "dependency-review"
    "deploy-services"
    "resource-management"
    "final-summary"
)

echo ""
echo "Checking required jobs..."
for job in "${REQUIRED_JOBS[@]}"; do
    if grep -q "^  ${job}:" "$WORKFLOW_FILE"; then
        echo "  ✅ $job"
    else
        echo "  ❌ $job not found"
        exit 1
    fi
done

# Check for workflow dispatch inputs
echo ""
echo "Checking workflow dispatch inputs..."
if grep -q "provision_infrastructure:" "$WORKFLOW_FILE"; then
    echo "  ✅ provision_infrastructure input defined"
else
    echo "  ❌ provision_infrastructure input not found"
    exit 1
fi

if grep -q "create_branches:" "$WORKFLOW_FILE"; then
    echo "  ✅ create_branches input defined"
else
    echo "  ❌ create_branches input not found"
    exit 1
fi

if grep -q "deploy_services:" "$WORKFLOW_FILE"; then
    echo "  ✅ deploy_services input defined"
else
    echo "  ❌ deploy_services input not found"
    exit 1
fi

# Check for key functionality
echo ""
echo "Checking key functionality..."

if grep -q "npm audit" "$WORKFLOW_FILE"; then
    echo "  ✅ npm audit present"
fi

if grep -q "pip-audit" "$WORKFLOW_FILE"; then
    echo "  ✅ pip-audit present"
fi

if grep -q "docker build" "$WORKFLOW_FILE"; then
    echo "  ✅ docker build present"
fi

if grep -q "docker-compose" "$WORKFLOW_FILE"; then
    echo "  ✅ docker-compose present"
fi

if grep -q "git checkout -b" "$WORKFLOW_FILE"; then
    echo "  ✅ branch creation present"
fi

if grep -q "SSL certificate" "$WORKFLOW_FILE" || grep -q "openssl" "$WORKFLOW_FILE"; then
    echo "  ✅ SSL certificate generation present"
fi

echo ""
echo "========================================"
echo "✅ All validations passed!"
echo "========================================"
echo ""
echo "Workflow is ready for testing via workflow_dispatch"
echo ""
