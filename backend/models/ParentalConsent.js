const mongoose = require('mongoose');

/**
 * Guardian approval for a minor's account within a family.
 *
 * The proposal requires parental approval for minors (§8) and parental consent
 * for child accounts (§6.3). Self-declaring memberType: 'child' at registration
 * is not consent — it is the child's own claim. This model is the actual
 * approval record: a child account stays restricted until a guardian (a family
 * admin or parent) approves it, and the decision is kept with who made it and
 * when, so the workflow is auditable.
 */
const parentalConsentSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // The guardian who decided. Null while pending.
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true },
);

// One consent record per child per family — re-requesting updates it in place.
parentalConsentSchema.index({ familyId: 1, child: 1 }, { unique: true });
// Guardians list what is still pending for their family.
parentalConsentSchema.index({ familyId: 1, status: 1 });

module.exports = mongoose.model('ParentalConsent', parentalConsentSchema);
