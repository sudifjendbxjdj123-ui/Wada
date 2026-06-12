"use client";
import { useState } from "react";

import type { ProductCategorie } from "@/lib/schema";

interface SizeGuideModalProps {
  category: ProductCategorie;
}

const SIZES_DATA = {
  vetements: [
    { size: "XS", chest: "31-33", waist: "24-26", length: "25" },
    { size: "S", chest: "33-35", waist: "26-28", length: "26" },
    { size: "M", chest: "35-37", waist: "28-30", length: "27" },
    { size: "L", chest: "37-40", waist: "30-33", length: "28" },
    { size: "XL", chest: "40-43", waist: "33-36", length: "29" },
    { size: "XXL", chest: "43-46", waist: "36-39", length: "30" },
  ],
  chaussures: [
    { size: "35", cm: "22", inches: "8.7" },
    { size: "36", cm: "23", inches: "9" },
    { size: "37", cm: "23.5", inches: "9.3" },
    { size: "38", cm: "24", inches: "9.4" },
    { size: "39", cm: "24.5", inches: "9.6" },
    { size: "40", cm: "25", inches: "9.8" },
    { size: "41", cm: "25.5", inches: "10" },
    { size: "42", cm: "26", inches: "10.2" },
  ],
  other: [],
};

export function SizeGuideModal({
  isOpen,
  onClose,
  category,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategorie;
}) {
  if (!isOpen) return null;

  const isShoes = category === "chaussures";
  const data = isShoes ? SIZES_DATA.chaussures : SIZES_DATA.vetements;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          maxWidth: 500,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Fredoka'", fontSize: 24, fontWeight: 500, margin: 0, color: "#1a1a1a" }}>
            Guide des tailles
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#8a7a68",
            }}
          >
            ×
          </button>
        </div>

        {isShoes ? (
          <div>
            <p style={{ fontSize: 12, color: "#8a7a68", fontFamily: "'Inter'", marginBottom: 16 }}>
              Mesurez la longueur de votre pied en cm ou pouces
            </p>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "'Inter'",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #e8dfd0" }}>
                  <th style={{ padding: 10, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                    Pointure
                  </th>
                  <th style={{ padding: 10, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                    Longueur (cm)
                  </th>
                  <th style={{ padding: 10, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                    Longueur (pouces)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <tr key={row.size} style={{ borderBottom: "1px solid #f0e9d8" }}>
                    <td style={{ padding: 10, fontSize: 12, color: "#1a1a1a", fontWeight: 600 }}>{row.size}</td>
                    <td style={{ padding: 10, fontSize: 12, color: "#5a5a5a" }}>{row.cm} cm</td>
                    <td style={{ padding: 10, fontSize: 12, color: "#5a5a5a" }}>{row.inches}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: "#8a7a68", fontFamily: "'Inter'", marginBottom: 16 }}>
              Toutes les mesures en pouces. Mesurez à plat sur le vêtement.
            </p>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "'Inter'",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #e8dfd0" }}>
                  <th style={{ padding: 10, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                    Taille
                  </th>
                  <th style={{ padding: 10, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                    Poitrine
                  </th>
                  <th style={{ padding: 10, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                    Taille
                  </th>
                  <th style={{ padding: 10, textAlign: "left", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                    Longueur
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <tr key={row.size} style={{ borderBottom: "1px solid #f0e9d8" }}>
                    <td style={{ padding: 10, fontSize: 12, color: "#1a1a1a", fontWeight: 600 }}>{row.size}</td>
                    <td style={{ padding: 10, fontSize: 12, color: "#5a5a5a" }}>{row.chest}"</td>
                    <td style={{ padding: 10, fontSize: 12, color: "#5a5a5a" }}>{row.waist}"</td>
                    <td style={{ padding: 10, fontSize: 12, color: "#5a5a5a" }}>{row.length}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 12,
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Inter'",
            cursor: "pointer",
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
