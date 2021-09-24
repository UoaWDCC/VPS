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

jest.mock("firebase/app", () => mockFirebase);
jest.mock("firebase/auth", () => mockFirebaseAuth);
jest.mock("react-firebase-hooks/auth", () => mockFirebaseHooks);
