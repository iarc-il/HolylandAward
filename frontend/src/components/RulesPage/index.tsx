import { useState } from "react";
import { Button } from "@/components/ui/button";

const RulesPage = () => {
  const [language, setLanguage] = useState<"en" | "he">("en");

  return (
    <div className="flex flex-col space-y-6 max-w-4xl pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contest Information & Rules</h1>
          <p className="text-foreground">
            Holyland Award Contest Guidelines and Requirements
          </p>
        </div>
        
        {/* Language Toggle */}
        <div className="flex gap-2 items-center bg-card border border-border rounded-full p-1 shadow-sm">
          <Button
            size="sm"
            variant={language === "en" ? "default" : "ghost"}
            onClick={() => setLanguage("en")}
            className="rounded-full h-8 px-3 gap-1.5"
          >
            <span className="text-base">🇬🇧</span>
            <span className="text-xs">EN</span>
          </Button>
          <Button
            size="sm"
            variant={language === "he" ? "default" : "ghost"}
            onClick={() => setLanguage("he")}
            className="rounded-full h-8 px-3 gap-1.5"
          >
            <span className="text-base">🇮🇱</span>
            <span className="text-xs">HE</span>
          </Button>
        </div>
      </div>

      {language === "en" ? <EnglishContent /> : <HebrewContent />}
    </div>
  );
};

const EnglishContent = () => {
  return (
    <div className="p-6 bg-card border border-border rounded-xl shadow-md space-y-8">
      {/* Section 1 - Definition of a "Square" */}
      <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Definition of a "Square"</h2>
          <ul className="space-y-2 ml-4">
            <li className="text-foreground">
              <span className="font-bold">A.</span> The State of Israel is geographically divided into a grid of geographic squares.
            </li>
            <li className="text-foreground">
              <span className="font-bold">B.</span> Each geographic square measures 10 km x 10 km.
            </li>
            <li className="text-foreground">
              <span className="font-bold">C.</span> West-to-East coordinates are designated by English letters (<strong>A–Q</strong>).
            </li>
            <li className="text-foreground">
              <span className="font-bold">D.</span> North-to-South coordinates are designated by a running two-digit sequence (<strong>00–43</strong>).
            </li>
            <li className="text-foreground">
              <span className="font-bold">E.</span> The combination of these two coordinates forms a geographic square (e.g., <strong>E-14</strong>).
            </li>
            <li className="text-foreground">
              <span className="font-bold">F.</span> Additionally, the State of Israel is divided into 23 administrative districts.
            </li>
            <li className="text-foreground">
              <span className="font-bold">G.</span> Each district is assigned a two-letter abbreviation.
            </li>
            <li className="text-foreground">
              <span className="font-bold">H.</span> <strong>List of District Abbreviations:</strong> AZ, AS, BS, BL, HD, HG, HF, HS, HB, JN, JS, KT, PT, RA, RH, RM, SM, TA, TK, YN, YZ, ZF.
            </li>
            <li className="text-foreground">
              <span className="font-bold">I.</span> A full <strong>"SQUARE"</strong> is defined as the combination of the geographic square and the district abbreviation (e.g., <strong>H-08-HF</strong>).
            </li>
            <li className="text-foreground">
              <span className="font-bold">J.</span> The objective is to contact as many unique "SQUARES" as possible.
            </li>
          </ul>
        </section>

        <hr className="border-border" />

        {/* Section 2 - Squares by District */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Squares by District</h2>
          <p className="text-foreground mb-4">
            Geographic squares organized by administrative district
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AK - Akko */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">AK - Akko</h3>
                <span className="text-sm text-foreground">(18 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                H-03, H-04, H-05, H-06, J-03, J-04, J-05, J-06, J-07, K-03, K-04, K-05, K-06, L-03, L-04, L-05, L-06, M-04
              </p>
            </div>

            {/* AS - Asqelon */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">AS - Asqelon</h3>
                <span className="text-sm text-foreground">(25 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                B-21, C-18, C-19, C-20, C-21, D-16, D-17, D-18, D-19, D-20, D-21, E-16, E-17, E-18, E-19, E-20, E-21, F-17, F-18, F-19, F-20, F-21, G-19, G-20, G-21
              </p>
            </div>

            {/* AZ - Azza */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">AZ - Azza</h3>
                <span className="text-sm text-foreground">(12 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                A-21, A-22, A-23, B-20, B-21, B-22, B-23, C-19, C-20, C-21, Z-22, Z-23
              </p>
            </div>

            {/* BS - Be'er Sheva */}
            <div className="p-4 bg-background border border-border rounded-lg lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">BS - Be'er Sheva</h3>
                <span className="text-sm text-foreground">(165 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                A-22, A-23, A-24, A-25, A-26, A-27, B-21, B-22, B-23, B-24, B-25, B-26, B-27, B-28, B-29, C-21, C-22, C-23, C-24, C-25, C-26, C-27, C-28, C-29, C-30, C-31, C-32, C-33, D-20, D-21, D-22, D-23, D-24, D-25, D-26, D-27, D-28, D-29, D-30, D-31, D-32, D-33, D-34, D-35, E-21, E-22, E-23, E-24, E-25, E-26, E-27, E-28, E-29, E-30, E-31, E-32, E-33, E-34, E-35, E-36, E-37, E-38, F-21, F-22, F-23, F-24, F-25, F-26, F-27, F-28, F-29, F-30, F-31, F-32, F-33, F-34, F-35, F-36, F-37, F-38, F-39, F-40, F-41, F-42, F-43, G-22, G-23, G-24, G-25, G-26, G-27, G-28, G-29, G-30, G-31, G-32, G-33, G-34, G-35, G-36, G-37, G-38, G-39, G-40, G-41, G-42, G-43, H-22, H-23, H-24, H-25, H-26, H-27, H-28, H-29, H-30, H-31, H-32, H-33, H-34, H-35, H-36, H-37, H-38, H-39, H-40, H-41, J-22, J-23, J-24, J-25, J-26, J-27, J-28, J-29, J-30, J-31, J-32, J-33, J-34, J-35, J-36, J-37, K-21, K-22, K-23, K-24, K-25, K-26, K-27, K-28, K-29, K-30, L-20, L-21, L-22, L-23, L-24, L-25, L-26, L-27, L-28, M-24, M-25, M-26
              </p>
            </div>

            {/* BL - Bethlehem */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">BL - Bethlehem</h3>
                <span className="text-sm text-foreground">(16 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                H-18, H-19, J-18, J-19, K-17, K-18, K-19, K-20, K-21, L-17, L-18, L-19, L-20, L-21, M-17, M-18
              </p>
            </div>

            {/* HD - Hadera */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">HD - Hadera</h3>
                <span className="text-sm text-foreground">(14 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                F-09, F-10, G-06, G-07, G-08, G-09, G-10, H-07, H-08, H-09, H-10, H-11, J-09, J-10
              </p>
            </div>

            {/* HG - Hagolan */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">HG - Hagolan</h3>
                <span className="text-sm text-foreground">(23 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                N-01, N-03, N-04, N-05, O-00, O-01, O-02, O-03, O-04, O-05, O-06, O-07, P-00, P-01, P-02, P-03, P-04, P-05, P-06, P-07, Q-03, Q-04, Q-05
              </p>
            </div>

            {/* HF - Haifa */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">HF - Haifa</h3>
                <span className="text-sm text-foreground">(9 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                G-06, G-07, H-05, H-06, H-07, H-08, J-05, J-06, J-07
              </p>
            </div>

            {/* HS - Hasharon */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">HS - Hasharon</h3>
                <span className="text-sm text-foreground">(9 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                F-10, F-11, F-12, F-13, G-10, G-11, G-12, H-11, H-12
              </p>
            </div>

            {/* HB - Hebron */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">HB - Hebron</h3>
                <span className="text-sm text-foreground">(20 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                F-21, F-22, G-19, G-20, G-21, G-22, H-18, H-19, H-20, H-21, H-22, J-19, J-20, J-21, J-22, K-19, K-20, K-21, K-22, L-21
              </p>
            </div>

            {/* JN - Jenin */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">JN - Jenin</h3>
                <span className="text-sm text-foreground">(14 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                H-10, J-09, J-10, J-11, K-09, K-10, K-11, L-09, L-10, L-11, L-12, M-10, M-11, M-12
              </p>
            </div>

            {/* JS - Jerusalem */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">JS - Jerusalem</h3>
                <span className="text-sm text-foreground">(17 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                F-17, F-18, F-19, G-16, G-17, G-18, G-19, H-16, H-17, H-18, H-19, J-16, J-17, J-18, K-16, K-17, K-18
              </p>
            </div>

            {/* KT - Kinneret */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">KT - Kinneret</h3>
                <span className="text-sm text-foreground">(15 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                L-05, L-06, L-07, M-05, M-06, M-07, M-08, N-04, N-05, N-06, N-07, N-08, O-05, O-06, O-07
              </p>
            </div>

            {/* PT - Petah Tiqwa */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">PT - Petah Tiqwa</h3>
                <span className="text-sm text-foreground">(11 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                F-12, F-13, F-14, F-15, G-12, G-13, G-14, G-15, H-12, H-14, H-15
              </p>
            </div>

            {/* RA - Ramallah */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">RA - Ramallah</h3>
                <span className="text-sm text-foreground">(19 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                G-15, G-16, G-17, H-14, H-15, H-16, H-17, J-14, J-15, J-16, J-17, K-14, K-15, K-16, K-17, L-14, L-15, L-16, L-17
              </p>
            </div>

            {/* RM - Ramla */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">RM - Ramla</h3>
                <span className="text-sm text-foreground">(8 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                F-15, F-16, F-17, G-15, G-16, G-17, H-15, H-16
              </p>
            </div>

            {/* RH - Rehovot */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">RH - Rehovot</h3>
                <span className="text-sm text-foreground">(10 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                D-16, D-17, E-15, E-16, E-17, E-18, F-15, F-16, F-17, F-18
              </p>
            </div>

            {/* SM - Shekhem */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">SM - Shekhem</h3>
                <span className="text-sm text-foreground">(10 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                J-11, J-12, J-13, K-11, K-12, K-13, K-14, L-12, L-13, L-14
              </p>
            </div>

            {/* TA - Tel Aviv */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">TA - Tel Aviv</h3>
                <span className="text-sm text-foreground">(6 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                E-13, E-14, E-15, F-13, F-14, F-15
              </p>
            </div>

            {/* TK - Tulkarm */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">TK - Tulkarm</h3>
                <span className="text-sm text-foreground">(15 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                G-12, G-13, G-14, H-10, H-11, H-12, H-13, H-14, J-10, J-11, J-12, J-13, J-14, K-13, K-14
              </p>
            </div>

            {/* YN - Yarden */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">YN - Yarden</h3>
                <span className="text-sm text-foreground">(28 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                L-11, L-12, L-13, L-14, L-15, L-16, L-17, L-19, L-20, L-21, M-10, M-11, M-12, M-13, M-14, M-15, M-16, M-17, M-18, M-19, N-11, N-12, N-13, N-14, N-15, N-16, N-17, N-18
              </p>
            </div>

            {/* YZ - Yizre'el */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">YZ - Yizre'el</h3>
                <span className="text-sm text-foreground">(23 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                H-07, H-08, H-09, J-06, J-07, J-08, J-09, K-06, K-07, K-08, K-09, L-06, L-07, L-08, L-09, L-10, M-08, M-09, M-10, M-11, N-08, N-09, N-10, N-11
              </p>
            </div>

            {/* ZF - Zefat */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">ZF - Zefat</h3>
                <span className="text-sm text-foreground">(15 squares)</span>
              </div>
              <p className="text-sm text-foreground flex flex-wrap gap-1">
                L-03, L-04, L-05, M-02, M-03, M-04, M-05, N-01, N-02, N-03, N-04, N-05, O-01, O-02, O-03
              </p>
            </div>
          </div>
        </section>

        <hr className="border-border" />

        {/* Section 3 - Award Categories & Criteria */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Award Categories & Criteria</h2>
          <ul className="space-y-3 ml-4">
            <li className="text-foreground">
              <span className="font-bold">A.</span> No mode restrictions.
            </li>
            <li className="text-foreground">
              <span className="font-bold">B.</span> No frequency/band restrictions.
            </li>
            <li className="text-foreground">
              <span className="font-bold">C.</span> Contacts made via terrestrial repeaters, etc., do not count toward the award.
            </li>
            <li className="text-foreground">
              <span className="font-bold">D. Category A: Operators within the Holyland</span>
              <ul className="ml-8 mt-2 space-y-1 list-disc text-foreground">
                <li>Must work at least <strong className="text-foreground">150 Squares</strong> from at least <strong className="text-foreground">18 different districts</strong>.</li>
                <li><strong className="text-foreground">Bonus:</strong> The square from which the applicant is operating counts as a "worked" square for the purpose of the award.</li>
              </ul>
            </li>
            <li className="text-foreground">
              <span className="font-bold">E. Category B: Operators in IARU Region 1</span>
              <ul className="ml-8 mt-2 space-y-1 list-disc text-foreground">
                <li>Must work at least <strong className="text-foreground">100 Squares</strong> from at least <strong className="text-foreground">13 different districts</strong>.</li>
              </ul>
            </li>
            <li className="text-foreground">
              <span className="font-bold">F. Category C: Operators in IARU Regions 2 & 3</span>
              <ul className="ml-8 mt-2 space-y-1 list-disc text-foreground">
                <li>Must work at least <strong className="text-foreground">50 Squares</strong> from at least <strong className="text-foreground">13 different districts</strong>.</li>
              </ul>
            </li>
          </ul>
        </section>
      </div>
  );
};

const HebrewContent = () => {
  return (
    <div className="p-6 bg-card border border-border rounded-xl shadow-md space-y-8" dir="rtl">
      {/* Section 1 - Definition of a "Square" */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">הגדרת ריבוע (SQUARE)</h2>
        <ul className="space-y-2 mr-4">
          <li className="text-foreground">
            <span className="font-bold">א.</span> מדינת ישראל חולקה באופן גיאוגרפי באמצעות רשת של ריבועים גיאוגרפיים
          </li>
          <li className="text-foreground">
            <span className="font-bold">ב.</span> כל ריבוע גיאוגרפי אורכו ורוחבו 10 ק"מ
          </li>
          <li className="text-foreground">
            <span className="font-bold">ג.</span> קואורדינטות ממערב למזרח הוגדרו ע"י אותיות לועזיות (<strong>A–Q</strong>)
          </li>
          <li className="text-foreground">
            <span className="font-bold">ד.</span> קואורדינטות מצפון לדרום הוגדרו ע"י זוג ספרות בסדר רץ (<strong>00–43</strong>)
          </li>
          <li className="text-foreground">
            <span className="font-bold">ה.</span> שילוב בין שני קואורדינטות נקרא מהווה ריבוע גיאוגרפי לדוגמא <strong>E-14</strong>
          </li>
          <li className="text-foreground">
            <span className="font-bold">ו.</span> מדינת ישראל חולקה ל 23 נפות אדמניסטרטיביות באופן גיאוגרפי
          </li>
          <li className="text-foreground">
            <span className="font-bold">ז.</span> כל נפה קיבלה קיצור בין שני אותיות לועזיות
          </li>
          <li className="text-foreground">
            <span className="font-bold">ח.</span> <strong>רשימת קיצורי הנפות:</strong> AZ, AS, BS, BL, HD, HG, HF, HS, HB, JN, JS, KT, PT, RA, RH, RM, SM, TA, TK, YN, YZ, ZF
          </li>
          <li className="text-foreground">
            <span className="font-bold">ט.</span> שילוב של נפה עם ריבוע גיאוגרפי מוגדר כ<strong>"SQUARE"</strong>. לדוגמא <strong>H-08-HF</strong>
          </li>
          <li className="text-foreground">
            <span className="font-bold">י.</span> המטרה ליצור קשר עם כמה שיותר "SQUARES"
          </li>
        </ul>
      </section>

      <hr className="border-border" />

      {/* Section 2 - Squares by District */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">ריבועים לפי נפות</h2>
        <p className="text-foreground mb-4">
          ריבועים גיאוגרפיים מאורגנים לפי נפות אדמיניסטרטיביות
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AK - Akko */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">AK - עכו</h3>
              <span className="text-sm text-foreground">(18 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              H-03, H-04, H-05, H-06, J-03, J-04, J-05, J-06, J-07, K-03, K-04, K-05, K-06, L-03, L-04, L-05, L-06, M-04
            </p>
          </div>

          {/* AS - Asqelon */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">AS - אשקלון</h3>
              <span className="text-sm text-foreground">(25 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              B-21, C-18, C-19, C-20, C-21, D-16, D-17, D-18, D-19, D-20, D-21, E-16, E-17, E-18, E-19, E-20, E-21, F-17, F-18, F-19, F-20, F-21, G-19, G-20, G-21
            </p>
          </div>

          {/* AZ - Azza */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">AZ - עזה</h3>
              <span className="text-sm text-foreground">(12 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              A-21, A-22, A-23, B-20, B-21, B-22, B-23, C-19, C-20, C-21, Z-22, Z-23
            </p>
          </div>

          {/* BS - Be'er Sheva */}
          <div className="p-4 bg-background border border-border rounded-lg lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">BS - באר שבע</h3>
              <span className="text-sm text-foreground">(165 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              A-22, A-23, A-24, A-25, A-26, A-27, B-21, B-22, B-23, B-24, B-25, B-26, B-27, B-28, B-29, C-21, C-22, C-23, C-24, C-25, C-26, C-27, C-28, C-29, C-30, C-31, C-32, C-33, D-20, D-21, D-22, D-23, D-24, D-25, D-26, D-27, D-28, D-29, D-30, D-31, D-32, D-33, D-34, D-35, E-21, E-22, E-23, E-24, E-25, E-26, E-27, E-28, E-29, E-30, E-31, E-32, E-33, E-34, E-35, E-36, E-37, E-38, F-21, F-22, F-23, F-24, F-25, F-26, F-27, F-28, F-29, F-30, F-31, F-32, F-33, F-34, F-35, F-36, F-37, F-38, F-39, F-40, F-41, F-42, F-43, G-22, G-23, G-24, G-25, G-26, G-27, G-28, G-29, G-30, G-31, G-32, G-33, G-34, G-35, G-36, G-37, G-38, G-39, G-40, G-41, G-42, G-43, H-22, H-23, H-24, H-25, H-26, H-27, H-28, H-29, H-30, H-31, H-32, H-33, H-34, H-35, H-36, H-37, H-38, H-39, H-40, H-41, J-22, J-23, J-24, J-25, J-26, J-27, J-28, J-29, J-30, J-31, J-32, J-33, J-34, J-35, J-36, J-37, K-21, K-22, K-23, K-24, K-25, K-26, K-27, K-28, K-29, K-30, L-20, L-21, L-22, L-23, L-24, L-25, L-26, L-27, L-28, M-24, M-25, M-26
            </p>
          </div>

          {/* BL - Bethlehem */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">BL - בית לחם</h3>
              <span className="text-sm text-foreground">(16 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              H-18, H-19, J-18, J-19, K-17, K-18, K-19, K-20, K-21, L-17, L-18, L-19, L-20, L-21, M-17, M-18
            </p>
          </div>

          {/* HD - Hadera */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">HD - חדרה</h3>
              <span className="text-sm text-foreground">(14 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              F-09, F-10, G-06, G-07, G-08, G-09, G-10, H-07, H-08, H-09, H-10, H-11, J-09, J-10
            </p>
          </div>

          {/* HG - Hagolan */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">HG - הגולן</h3>
              <span className="text-sm text-foreground">(23 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              N-01, N-03, N-04, N-05, O-00, O-01, O-02, O-03, O-04, O-05, O-06, O-07, P-00, P-01, P-02, P-03, P-04, P-05, P-06, P-07, Q-03, Q-04, Q-05
            </p>
          </div>

          {/* HF - Haifa */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">HF - חיפה</h3>
              <span className="text-sm text-foreground">(9 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              G-06, G-07, H-05, H-06, H-07, H-08, J-05, J-06, J-07
            </p>
          </div>

          {/* HS - Hasharon */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">HS - השרון</h3>
              <span className="text-sm text-foreground">(9 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              F-10, F-11, F-12, F-13, G-10, G-11, G-12, H-11, H-12
            </p>
          </div>

          {/* HB - Hebron */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">HB - חברון</h3>
              <span className="text-sm text-foreground">(20 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              F-21, F-22, G-19, G-20, G-21, G-22, H-18, H-19, H-20, H-21, H-22, J-19, J-20, J-21, J-22, K-19, K-20, K-21, K-22, L-21
            </p>
          </div>

          {/* JN - Jenin */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">JN - ג'נין</h3>
              <span className="text-sm text-foreground">(14 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              H-10, J-09, J-10, J-11, K-09, K-10, K-11, L-09, L-10, L-11, L-12, M-10, M-11, M-12
            </p>
          </div>

          {/* JS - Jerusalem */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">JS - ירושלים</h3>
              <span className="text-sm text-foreground">(17 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              F-17, F-18, F-19, G-16, G-17, G-18, G-19, H-16, H-17, H-18, H-19, J-16, J-17, J-18, K-16, K-17, K-18
            </p>
          </div>

          {/* KT - Kinneret */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">KT - כנרת</h3>
              <span className="text-sm text-foreground">(15 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              L-05, L-06, L-07, M-05, M-06, M-07, M-08, N-04, N-05, N-06, N-07, N-08, O-05, O-06, O-07
            </p>
          </div>

          {/* PT - Petah Tiqwa */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">PT - פתח תקווה</h3>
              <span className="text-sm text-foreground">(11 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              F-12, F-13, F-14, F-15, G-12, G-13, G-14, G-15, H-12, H-14, H-15
            </p>
          </div>

          {/* RA - Ramallah */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">RA - רמאללה</h3>
              <span className="text-sm text-foreground">(19 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              G-15, G-16, G-17, H-14, H-15, H-16, H-17, J-14, J-15, J-16, J-17, K-14, K-15, K-16, K-17, L-14, L-15, L-16, L-17
            </p>
          </div>

          {/* RM - Ramla */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">RM - רמלה</h3>
              <span className="text-sm text-foreground">(8 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              F-15, F-16, F-17, G-15, G-16, G-17, H-15, H-16
            </p>
          </div>

          {/* RH - Rehovot */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">RH - רחובות</h3>
              <span className="text-sm text-foreground">(10 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              D-16, D-17, E-15, E-16, E-17, E-18, F-15, F-16, F-17, F-18
            </p>
          </div>

          {/* SM - Shekhem */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">SM - שכם</h3>
              <span className="text-sm text-foreground">(10 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              J-11, J-12, J-13, K-11, K-12, K-13, K-14, L-12, L-13, L-14
            </p>
          </div>

          {/* TA - Tel Aviv */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">TA - תל אביב</h3>
              <span className="text-sm text-foreground">(6 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              E-13, E-14, E-15, F-13, F-14, F-15
            </p>
          </div>

          {/* TK - Tulkarm */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">TK - טול כרם</h3>
              <span className="text-sm text-foreground">(15 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              G-12, G-13, G-14, H-10, H-11, H-12, H-13, H-14, J-10, J-11, J-12, J-13, J-14, K-13, K-14
            </p>
          </div>

          {/* YN - Yarden */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">YN - הירדן</h3>
              <span className="text-sm text-foreground">(28 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              L-11, L-12, L-13, L-14, L-15, L-16, L-17, L-19, L-20, L-21, M-10, M-11, M-12, M-13, M-14, M-15, M-16, M-17, M-18, M-19, N-11, N-12, N-13, N-14, N-15, N-16, N-17, N-18
            </p>
          </div>

          {/* YZ - Yizre'el */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">YZ - יזרעאל</h3>
              <span className="text-sm text-foreground">(23 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              H-07, H-08, H-09, J-06, J-07, J-08, J-09, K-06, K-07, K-08, K-09, L-06, L-07, L-08, L-09, L-10, M-08, M-09, M-10, M-11, N-08, N-09, N-10, N-11
            </p>
          </div>

          {/* ZF - Zefat */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">ZF - צפת</h3>
              <span className="text-sm text-foreground">(15 ריבועים)</span>
            </div>
            <p className="text-sm text-foreground flex flex-wrap gap-1">
              L-03, L-04, L-05, M-02, M-03, M-04, M-05, N-01, N-02, N-03, N-04, N-05, O-01, O-02, O-03
            </p>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Section 3 - Award Categories & Criteria */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">קריטריונים לקבלת תעודת ארץ הקודש</h2>
        <ul className="space-y-3 mr-4">
          <li className="text-foreground">
            <span className="font-bold">א.</span> אין הגבלת סוג שידור (MODE)
          </li>
          <li className="text-foreground">
            <span className="font-bold">ב.</span> אין הגבלת תדר שידור
          </li>
          <li className="text-foreground">
            <span className="font-bold">ג.</span> תקשורת באמצעות ממסרים וכד' אינה נחשבת לצרכי קבלת התעודה
          </li>
          <li className="text-foreground">
            <span className="font-bold">ד. קטגוריה A: חובב רדיו הפועל מארץ הקודש</span>
            <ul className="mr-8 mt-2 space-y-1 list-disc text-foreground">
              <li>עבד <strong className="text-foreground">150 ריבועים</strong> מ<strong className="text-foreground">18 נפות לפחות</strong></li>
              <li><strong className="text-foreground">בונוס:</strong> אזור ממנו מפעיל החובב ייחשב כאזור לצרכי התעודה כאילו עבד את אותו האזור</li>
            </ul>
          </li>
          <li className="text-foreground">
            <span className="font-bold">ה. קטגוריה B: חובב רדיו הפועל מ IARU Reg 1</span>
            <ul className="mr-8 mt-2 space-y-1 list-disc text-foreground">
              <li>עבד <strong className="text-foreground">100 ריבועים</strong> מ<strong className="text-foreground">13 נפות לפחות</strong></li>
            </ul>
          </li>
          <li className="text-foreground">
            <span className="font-bold">ו. קטגוריה C: חובב רדיו הפועל מ IARU reg 2&3</span>
            <ul className="mr-8 mt-2 space-y-1 list-disc text-foreground">
              <li>עבד <strong className="text-foreground">50 ריבועים</strong> מ<strong className="text-foreground">13 נפות לפחות</strong></li>
            </ul>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default RulesPage;
