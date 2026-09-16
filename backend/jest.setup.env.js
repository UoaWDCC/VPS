// runs before the test framework and before any test file's imports are
// evaluated.

// small limit used in the 413 file size test (~524 bytes)
process.env.MAX_FILE_SIZE_MB = process.env.MAX_FILE_SIZE_MB || "0.0005";

