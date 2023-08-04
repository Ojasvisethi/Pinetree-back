const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    registrationDate: {
      type: Date,
      required: true,
    },
    registrationTerm: {
      type: String,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
    },
    canDownload: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

// Add a virtual property to check if the user is allowed to log in
userSchema.virtual("canLogin").get(function () {
  // Check if lastLogin exists and is within the registration term
  if (this.lastLogin) {
    const termInMilliseconds = parseTermToMilliseconds(this.registrationTerm);
    const endDate = new Date(
      this.registrationDate.getTime() + termInMilliseconds
    );
    return this.lastLogin < endDate;
  }

  // If lastLogin is null, the user has never logged in, so they can login
  return true;
});

// Helper function to convert the registration term to milliseconds
function parseTermToMilliseconds(term) {
  const terms = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000, // Assuming 30 days per month
    // Add more terms if needed
  };

  return terms[term] || 0;
}

// Set the virtual property to be included when converting to JSON
userSchema.set("toJSON", { getters: true, virtuals: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
