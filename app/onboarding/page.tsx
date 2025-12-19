"use client";
import ProgressBar from "../components/ProgressBar";
import { useEffect, useState } from "react";
import { REGISTER_STEPS } from "../constants/dropdownOptions";

//step components
import PersonalDetails from "../components/steps/PersonalDetails";
import EducationalDetails from "../components/steps/EducationalDetails";
import Declaration from "../components/steps/Declaration";
import FinalVerification from "../components/steps/FinalVerification";
import Payment from "../components/steps/Payment";
import useUserStore from "../store/userStore";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Contact from "../components/Contact";
import { Button } from "@heroui/react";
import CustomToast from "../components/CustomToast";

const CONTACT = { name: "Mr. Binoy P. K", number: "9446717178" };

export default function OnBoarding() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [seatConfirmed, setSeatConfirmed] = useState<boolean>(false);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [canOnboard, setCanOnboard] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { clearUserData, fetchUserData, userData } = useUserStore();
  const session = useSession();
  const router = useRouter();

  const handleNext = async () => {
    // Check if user can proceed to the next step based on their current onboarding progress
    const userOnboardingStep = userData?.onboardingStep || 0;
    const nextStep = currentStep + 1;
    
    // If trying to go to a step beyond what they've completed, block them
    if (nextStep > userOnboardingStep) {
      CustomToast({ 
        title: "Step Not Completed", 
        description: "Please complete the current step before proceeding to the next one."
      });
      return;
    }

    // Validate photo upload on PersonalDetails step (step 0)
    if (currentStep === 0) {
      const studentPhoto = userData?.["Uploads"]?.["studentPhoto"];
      if (!studentPhoto || studentPhoto === "/no_img.png" || studentPhoto.trim() === "") {
        CustomToast({ 
          title: "Photo Required", 
          description: "Please upload a photo before proceeding to the next step."
        });
        return;
      }
    }
    
    // Move to next step
    if (nextStep <= REGISTER_STEPS.length - 1) {
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleLogout = () => {
    clearUserData();
    signOut({ callbackUrl: "/login" });
  };

  // Debug logging - keeping this for debugging purposes
  useEffect(() => {
    console.log("Session status:", session.status);
    console.log("Session data:", session);
  }, [session]);

  // Consolidated session and user data handling
  useEffect(() => {
    // Initial session check
    if (session.status === "loading") {
      return;
    }
    if (session.status === "unauthenticated") {
      location.reload();
    }
    const handleSessionData = async () => {
      try {
        // If not authenticated, redirect to login
        if (session.status === "unauthenticated") {
          setIsLoading(false);
          router.push("/login");
          return;
        }

        // If authenticated but no user ID, something is wrong
        if (!session.data?.user?.id) {
          console.error("Authenticated but no user ID");
          setIsLoading(false);
          return;
        }

        // Fetch user data
        const userId = session.data.user.id;
        console.log("Fetching user data for ID:", userId);

        const userData = await fetchUserData(userId);

        if (!userData) {
          console.log("No user data returned");
          setIsLoading(false);
          return;
        }

        console.log("User data loaded:", userData);

        // Update state based on user data
        setCanOnboard(userData.canOnboard || false);

        // Set current step based on user's onboarding progress
        const userOnboardingStep = userData.onboardingStep || 0;
        setCurrentStep(Math.min(userOnboardingStep, REGISTER_STEPS.length - 1));

        if (userData["Student Details"] && userData["Student Details"]["Seat Confirmed"]) {
          setSeatConfirmed(true);
        }

        // Check if payment is completed (transaction number is not empty)
        if (userData["Payment"] && userData["Payment"]["Transaction Number"]) {
          console.log("Payment completed, redirecting to user page");
          setPaymentCompleted(true);
          router.push("/user");
          return;
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if session status changes to authenticated
    if (session.status === "authenticated") {
      handleSessionData();
    }
  }, [session.status, session.data, fetchUserData, router]);

  // We removed the redundant effect that was setting isLoading to true
  // when session.status was "loading"

  const renderStepContent = () => {
    if (seatConfirmed && !paymentCompleted) {
      return <Payment />;
    }
    switch (currentStep) {
      case 0:
        return <PersonalDetails />;
      case 1:
        return <EducationalDetails />;
      case 2:
        return <Declaration />;
      case 3:
        return <FinalVerification />;
      case 4:
        return <Payment />;
      default:
        return null;
    }
  };

  // Show loading spinner while data is loading or session is initializing
  if (isLoading || session.status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If payment is completed, redirect to user page (additional safety check)
  if (paymentCompleted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show access restricted message if user can't onboard
  if (canOnboard === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 ">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 w-full max-w-md rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-bold text-yellow-800">Approval Required</h3>
              <div className="mt-2 text-md text-yellow-700">
                <p>Please contact <br/>{CONTACT.name}: {CONTACT.number}<br/> for approving your application</p>
              </div>
              <div className="mt-4">
                <Button className="bg-red-600 border-red-900 text-white" variant="bordered" onPress={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="flex flex-col">



    
      <div className="flex justify-center h-20 w-full">
        <ProgressBar currentStep={seatConfirmed ? 4 : currentStep} handleLogout={handleLogout} />
      </div>
      <div>
        <div className="flex flex-col items-center min-h-screen bg-background pb-4 pt-4">
          <div className="w-full">{renderStepContent()}</div>
          <div className="flex flex-col md:flex-row-reverse items-center justify-between w-full px-10 pb-10 md:max-w-[70%] ">
            
            {!seatConfirmed && (
              <div className="flex space-x-4 bg-textBoxBackground items-center shadow-xl p-4 rounded-xl">
                <Button
                  id="previousPage"
                  className="bg-red-600 border-red-900 text-white"
                  variant="bordered"
                  onPress={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                {
                  currentStep !== 4 &&(
                <Button
                  id="nextPage"
                  className="bg-green-600 border-green-900 text-white"
                  variant="bordered"
                  onPress={handleNext}
                  disabled={currentStep === REGISTER_STEPS.length - 1 || (currentStep + 1) > (userData?.onboardingStep || 0)}
                >
                  {(currentStep + 1) > (userData?.onboardingStep || 0) ? "Complete Current Step" : "Next"}
                </Button>
                  )
                }
              </div>
            )}
            <Contact className="!relative" />
          </div>
        </div>
      </div>
    </div>
  );
}
