from __future__ import annotations

from .schemas import DemoAccountRecord, PublicDemoAccount

DEMO_PASSWORD = "teachflow-demo"

DEMO_ACCOUNTS: tuple[DemoAccountRecord, ...] = (
    DemoAccountRecord(
        public=PublicDemoAccount(
            id="demo-admin",
            email="admin@teachflow.local",
            name="Admin Demo",
            role="admin",
            organization_id="org-demo",
            label="Admin workspace",
        ),
        password=DEMO_PASSWORD,
    ),
    DemoAccountRecord(
        public=PublicDemoAccount(
            id="demo-teacher",
            email="teacher@teachflow.local",
            name="Teacher Demo",
            role="teacher",
            organization_id="org-demo",
            label="Teacher workspace",
        ),
        password=DEMO_PASSWORD,
    ),
    DemoAccountRecord(
        public=PublicDemoAccount(
            id="demo-student",
            email="student@teachflow.local",
            name="Student Demo",
            role="student",
            organization_id="org-demo",
            label="Student workspace",
        ),
        password=DEMO_PASSWORD,
    ),
)

DEMO_ACCOUNTS_BY_EMAIL = {
    account.public.email.lower(): account for account in DEMO_ACCOUNTS
}
