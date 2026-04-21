import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import AddFacilityForm from "@/components/add-facility-form";
import { PageHero, SectionCard } from "@/components/admin-page-kit";
import { requirePermission } from "@/lib/permissions";

export default async function NewFacilityPage() {
  await requirePermission("facilities", "create");

  return (
    <AppShell>
      <PageHero
        eyebrow="تسجيل منشأة جديدة داخل النظام"
        title="إضافة منشأة"
        subtitle="أدخل البيانات الأساسية للمنشأة ثم احفظها"
        icon={Building2}
      />

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="نموذج إضافة المنشأة"
          subtitle="البيانات الأساسية للمنشأة"
        >
          <div style={{ marginBottom: "12px" }}>
            <Link
              href="/facilities"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                color: "#0f766e",
                fontWeight: 700,
              }}
            >
              <ArrowRight size={16} />
              العودة إلى قائمة المنشآت
            </Link>
          </div>

          <AddFacilityForm />
        </SectionCard>
      </div>
    </AppShell>
  );
}
