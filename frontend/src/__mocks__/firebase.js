/**
 * This file is imported in setupTests.js (react automatically runs setupTests.js when running tests)
 *
 * In the context/FirebaseContextProvider, it imports the following libraries:
 * - Firebase
 * - FirebaseAuth
 * - FirebaseHooks
 * - FirebaseStorage
 *
 * This file when imported, mocks those libraries and therefore react tests will use the code below as the above libraries
 */

const mockFirebase = {
  initializeApp: jest.fn().mockReturnValue({}),
};

const mockFirebaseAuth = {
  getAuth: jest.fn().mockReturnValue({
    auth: jest.fn().mockReturnValue({
      currentUser: {
        displayName: "redirectResultTestDisplayName",
        email: "redirectTest@test.com",
        emailVerified: true,
        uid: "id123",
        providerData: [
          {
            email: "redirectTest@test.com",
            displayName: "redirectResultTestDisplayName",
            providerId: "google",
          },
        ],
      },
      signInWithRedirect: jest.fn(),
      getRedirectResult: jest.fn().mockReturnValue({
        credential: {
          providerId: "Google",
        },
        user: {
          getIdToken: jest.fn().mockResolvedValue("abc1234"),
        },
        additionalUserInfo: {
          profile: {
            email: "__tests__@__tests__.com",
            name: "John Doe",
          },
        },
      }),
      onAuthStateChanged: jest.fn(() => {}),
      signOut: jest.fn(() => {}),
    }),
  }),
  GoogleAuthProvider: class {},
};

const mockFirebaseHooks = {
  useAuthState: () => {
    return [
      {
        getIdToken: jest.fn().mockResolvedValue("abc1234"),
      },
      false,
      null,
    ];
  },
};

const mockFirebaseStorage = { getStorage: jest.fn().mockReturnValue({}) };

jest.mock("firebase/app", () => mockFirebase);
jest.mock("firebase/auth", () => mockFirebaseAuth);
jest.mock("react-firebase-hooks/auth", () => mockFirebaseHooks);
jest.mock("firebase/storage", () => mockFirebaseStorage);
