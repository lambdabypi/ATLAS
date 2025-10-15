// src/components/StyleWrapper.jsx

'use client';

import { useEffect } from 'react';
import { keyframes } from '../styles/styleUtils';

// A component that injects additional styles into the page
export default function StyleWrapper({ children, additionalStyles = '' }) {
	useEffect(() => {
		// Create a style element for global styles
		const styleElement = document.createElement('style');

		// Define keyframes and global styles
		const globalStyles = `
      /* Keyframes for animations */
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: .5;
        }
      }
      
      /* Basic reset and global styles */
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 
                     Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #1f2937;
        background-color: #f9fafb;
      }
      
      /* Common elements */
      a {
        color: #2563eb;
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      button {
        cursor: pointer;
      }
      
      /* Utility classes */
      .loading-spinner {
        display: inline-block;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        border: 2px solid #e5e7eb;
        border-top-color: #2563eb;
        animation: spin 1s linear infinite;
      }
      
      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 1rem;
      }
      
      .card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }
      
      /* Custom styles provided by component */
      ${additionalStyles}
    `;

		styleElement.innerHTML = globalStyles;
		document.head.appendChild(styleElement);

		// Clean up the style element when the component unmounts
		return () => {
			document.head.removeChild(styleElement);
		};
	}, [additionalStyles]);

	return children;
}