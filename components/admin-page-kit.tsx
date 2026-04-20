import Link from "next/link";
import { ReactNode } from "react";

type Tone = "teal" | "amber" | "red" | "slate";

function toneStyles(tone: Tone) {
  const map = {
    teal: {
      iconBg: "#ecfeff",
      iconColor: "#0f766e",
      iconBorder: "1px solid #ccfbf1",
      softBg: "#f0fdfa",
      softText: "#0f766e",
      softBorder: "1px solid #ccfbf1",
    },
    amber: {
      iconBg: "#fffbeb",
      iconColor: "#b45309",
      iconBorder: "1px solid #fde68a",
      softBg: "#fffbeb",
      softText: "#b45309",
      softBorder: "1px solid #fde68a",
    },
    red: {
      iconBg: "#fef2f2",
      iconColor: "#b91c1c",
      iconBorder: "1px solid #fecaca",
      softBg: "#fef2f2",
      softText: "#b91c1c",
      softBorder: "1px solid #fecaca",
    },
    slate: {
      iconBg: "#f8fafc",
      iconColor: "#475569",
      iconBorder: "1px solid #e2e8f0",
      softBg: "#f8fafc",
      softText: "#475569",
      softBorder: "1px solid #e2e8f0",
    },
  };

  return map[tone];
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  pills = [],
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: any;
  pills?: string[];
}) {
  return (
    <section className="card" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginBottom: "6px",
                lineHeight: 1.6,
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              fontSize: "28px",
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                marginTop: "10px",
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#64748b",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {Icon ? (
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ecfeff",
              color: "#0f766e",
              border: "1px solid #ccfbf1",
              flexShrink: 0,
            }}
          >
            <Icon size={32} />
          </div>
        ) : null}
      </div>

      {pills.length > 0 ? (
        <>
          <div
            style={{
              height: "1px",
              background: "#e2e8f0",
              margin: "16px 0 14px",
            }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {pills.map((pill) => (
              <span
                key={pill}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontSize: "24px",
          lineHeight: 1.2,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: "6px",
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="card" style={{ padding: "18px" }}>
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: any;
  tone?: Tone;
}) {
  const theme = toneStyles(tone);

  return (
    <div
      className="card"
      style={{
        minHeight: "146px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "16px",
              color: "#475569",
              fontWeight: 700,
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "52px",
              lineHeight: 1,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.iconBg,
            color: theme.iconColor,
            border: theme.iconBorder,
            flexShrink: 0,
          }}
        >
          <Icon size={28} />
        </div>
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "14px",
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

export function ActionCard({
  href,
  title,
  icon: Icon,
  tone = "slate",
}: {
  href: string;
  title: string;
  icon: any;
  tone?: Tone;
}) {
  const theme = toneStyles(tone);

  return (
    <Link
      href={href}
      className="card"
      style={{
        minHeight: "180px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        padding: "20px 14px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "74px",
          height: "74px",
          borderRadius: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.iconBg,
          color: theme.iconColor,
          border: theme.iconBorder,
        }}
      >
        <Icon size={34} />
      </div>

      <div
        style={{
          marginTop: "14px",
          fontSize: "18px",
          lineHeight: 1.5,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {title}
      </div>
    </Link>
  );
}

export function ListRow({
  href,
  title,
  subtitle,
  rightBadge,
}: {
  href: string;
  title: string;
  subtitle: string;
  rightBadge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "18px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        textDecoration: "none",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "16px",
            lineHeight: 1.45,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "4px",
            fontSize: "13px",
            lineHeight: 1.7,
            color: "#64748b",
          }}
        >
          {subtitle}
        </div>
      </div>

      {rightBadge ? <div style={{ flexShrink: 0 }}>{rightBadge}</div> : null}
    </Link>
  );
}

export function SoftBadge({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: Tone;
}) {
  const theme = toneStyles(tone);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: "999px",
        background: theme.softBg,
        color: theme.softText,
        border: theme.softBorder,
        fontSize: "13px",
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        border: "1px dashed #cbd5e1",
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: "6px",
          fontSize: "14px",
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        {description}
      </div>
    </div>
  );
}
