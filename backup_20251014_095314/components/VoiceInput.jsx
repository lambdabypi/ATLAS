// src/components/VoiceInput.jsx
'use client';

import { useState, useEffect, useRef } from 'react';

export default function VoiceInput({ onTranscriptReady, placeholder = 'Press the microphone button and speak', language = 'en-US' }) {
	const [isRecording, setIsRecording] = useState(false);
	const [transcript, setTranscript] = useState('');
	const [error, setError] = useState('');
	const [isSupported, setIsSupported] = useState(true);

	const recognitionRef = useRef(null);

	// Initialize speech recognition
	useEffect(() => {
		// Check if the browser supports the Web Speech API
		if (typeof window !== 'undefined') {
			// Use the appropriate Speech Recognition interface
			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

			if (SpeechRecognition) {
				recognitionRef.current = new SpeechRecognition();
				recognitionRef.current.continuous = true;
				recognitionRef.current.interimResults = true;
				recognitionRef.current.lang = language;

				// Set up event handlers
				recognitionRef.current.onresult = (event) => {
					let interimTranscript = '';
					let finalTranscript = '';

					for (let i = event.resultIndex; i < event.results.length; i++) {
						const transcript = event.results[i][0].transcript;
						if (event.results[i].isFinal) {
							finalTranscript += transcript + ' ';
						} else {
							interimTranscript += transcript;
						}
					}

					setTranscript(finalTranscript || interimTranscript);
				};

				recognitionRef.current.onerror = (event) => {
					console.error('Speech recognition error:', event.error);
					setError(event.error);
					setIsRecording(false);
				};

				recognitionRef.current.onend = () => {
					setIsRecording(false);

					// If we have a transcript, pass it to the parent component
					if (transcript && onTranscriptReady) {
						onTranscriptReady(transcript);
					}
				};
			} else {
				setIsSupported(false);
				setError('Speech recognition is not supported in this browser');
			}
		}

		// Clean up
		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.onresult = null;
				recognitionRef.current.onerror = null;
				recognitionRef.current.onend = null;

				if (isRecording) {
					recognitionRef.current.stop();
				}
			}
		};
		// We intentionally do not include transcript as a dependency because it would
		// cause the effect to run again and reset the recognition
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language, onTranscriptReady]);

	// Start/stop recording
	const toggleRecording = () => {
		if (!isSupported) {
			return;
		}

		if (isRecording) {
			recognitionRef.current.stop();
		} else {
			setTranscript('');
			setError('');
			try {
				recognitionRef.current.start();
				setIsRecording(true);
			} catch (err) {
				console.error('Failed to start speech recognition:', err);
				setError('Failed to start speech recognition');
			}
		}
	};

	return (
		<div className="w-full">
			<div className="flex items-center">
				<button
					type="button"
					onClick={toggleRecording}
					disabled={!isSupported}
					className={`rounded-full p-3 mr-2 flex items-center justify-center ${isRecording
						? 'bg-red-500 text-white animate-pulse'
						: isSupported
							? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
							: 'bg-gray-200 text-gray-500 cursor-not-allowed'
						}`}
					aria-label={isRecording ? 'Stop recording' : 'Start recording'}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="w-6 h-6"
					>
						{isRecording ? (
							<path d="M8 5a1 1 0 011-1h6a1 1 0 011 1v14a1 1 0 01-1 1H9a1 1 0 01-1-1V5z" />
						) : (
							<path d="M12 15c1.93 0 3.5-1.57 3.5-3.5V5c0-1.93-1.57-3.5-3.5-3.5S8.5 3.07 8.5 5v6.5c0 1.93 1.57 3.5 3.5 3.5z" />
						)}
					</svg>
				</button>

				<div className="flex-1">
					{transcript ? (
						<div className="p-3 border border-gray-300 rounded-md bg-white">
							{transcript}
						</div>
					) : (
						<div className="p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
							{isRecording ? 'Listening...' : placeholder}
						</div>
					)}
				</div>

				{transcript && (
					<button
						type="button"
						onClick={() => {
							if (onTranscriptReady) {
								onTranscriptReady(transcript);
							}
							setTranscript('');
						}}
						className="ml-2 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600"
					>
						Use
					</button>
				)}
			</div>

			{error && (
				<div className="mt-2 text-sm text-red-600">
					{error === 'not-allowed' ?
						'Microphone access denied. Please allow microphone access in your browser settings.' :
						error}
				</div>
			)}

			{!isSupported && (
				<div className="mt-2 text-sm text-amber-600">
					Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.
				</div>
			)}
		</div>
	);
}