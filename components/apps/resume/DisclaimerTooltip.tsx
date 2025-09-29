import {useState} from "react";

export default function DisclaimerTooltip() {
    const [hover, setHover] = useState(false);

// How this component fits
//
// Purpose: A tiny tooltip that reassures users about privacy when they paste their resume or job description.
//
// Placement: Drop the <InfoTooltip /> right next to the label for your resume input (Story Text, Paste Story, etc.).
//
// User experience:
//
// They see a subtle ⓘ icon.

// This application makes a best effort to scrub personally identifiable information such as emails, phone numbers, and links before passing resume or job description text to the backend.
// Inputs are processed automatically to generate comparison results, but they are not retained, not used for training, and never manually reviewed.
// This is not a generative AI product — no new content is created from your data, and nothing is shared externally.


    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <span className="ml-2 cursor-pointer text-gray-400">ⓘ</span>
            {hover && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white shadow-lg z-50">
                    Best effort is made to remove emails, phones, and links before text is sent to the backend.
                    Input is processed automatically, never stored, and never manually reviewed.

                </div>
            )}
        </div>
    );
}
