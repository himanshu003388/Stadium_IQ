import React, { memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS } from '../utils/styles';
import { getStatusColor } from '../utils/helpers';

function VendorDashboard() {
  const vendors = useStadiumContext((s) => s.contextData.vendors);
  const gates = useStadiumContext((s) => s.contextData.gates);

  const getAIRecommendation = (vendor, density) => {
    if (vendor.stockLevel < 20) {
      return `CRITICAL: Immediate restock required. Expected heavy traffic from zone. Dispatching supply cart from Main Depot.`;
    }
    if (vendor.stockLevel < 50 && density > 0.8) {
      return `WARNING: High crowd density (${Math.round(density * 100)}%) detected nearby. Pre-emptive restock recommended.`;
    }
    if (vendor.stockLevel < 50) {
      return `Monitor stock levels. Prepare next scheduled restock.`;
    }
    return `Stock levels nominal. No action required.`;
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 animate-fade-in-up">
      <div>
        <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
          Smart Concessions & Vendor Support
        </h2>
        <p className="text-sm" style={{ color: COLORS.outline }}>
          AI-driven supply chain management based on real-time crowd density
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(vendors || []).map((vendor, i) => {
          const nearestGate =
            gates.find((g) => vendor.zone.toLowerCase().startsWith(g.direction.toLowerCase())) ||
            gates[0];
          const density = nearestGate ? nearestGate.density : 0.5;

          return (
            <div key={vendor.id} className={`card p-5 stagger-${i + 1}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: COLORS.surface }}
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined"
                      style={{ color: COLORS.primary, fontVariationSettings: "'FILL' 1" }}
                    >
                      storefront
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
                      {vendor.name}
                    </h3>
                    <p className="text-xs font-medium" style={{ color: COLORS.outline }}>
                      {vendor.zone}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      background: `${getStatusColor(vendor.status)}20`,
                      color: getStatusColor(vendor.status),
                    }}
                  >
                    {vendor.stockLevel}% STOCK
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: getStatusColor(vendor.status) }}
                  >
                    {vendor.status === 'critical'
                      ? 'Critical'
                      : vendor.status === 'warning'
                        ? 'Low'
                        : 'Good'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div
                  className="density-bar mt-1.5"
                  style={{ background: COLORS.surfaceDim }}
                  role="progressbar"
                  aria-valuenow={vendor.stockLevel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${vendor.name} stock level: ${vendor.stockLevel}%`}
                >
                  <div
                    className="density-fill"
                    style={{
                      width: `${vendor.stockLevel}%`,
                      background: getStatusColor(vendor.status),
                    }}
                  />
                </div>
              </div>

              <div
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{
                  background: vendor.status === 'critical' ? COLORS.errorContainer : COLORS.surface,
                  border: vendor.status === 'critical' ? `1px solid ${COLORS.error}` : 'none',
                }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined shrink-0 text-sm"
                  style={{
                    color: vendor.status === 'critical' ? COLORS.error : COLORS.primary,
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  smart_toy
                </span>
                <p
                  className="text-xs"
                  style={{
                    color:
                      vendor.status === 'critical'
                        ? COLORS.onErrorContainer
                        : COLORS.onSurfaceVariant,
                  }}
                >
                  <strong className="block mb-0.5">AI Supply Chain Insight:</strong>
                  {getAIRecommendation(vendor, density)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * VendorDashboard takes no direct props — reads all data from StadiumContext.
 */
VendorDashboard.propTypes = {};
export default memo(VendorDashboard);
