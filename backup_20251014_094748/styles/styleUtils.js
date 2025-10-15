// src/styles/styleUtils.js

/**
 * Utility functions for working with inline styles
 */

// Define common colors used throughout the application
export const colors = {
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		500: '#3b82f6',
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
		900: '#1e3a8a',
	},
	gray: {
		50: '#f9fafb',
		100: '#f3f4f6',
		200: '#e5e7eb',
		300: '#d1d5db',
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
		700: '#374151',
		800: '#1f2937',
		900: '#111827',
	},
	red: {
		100: '#fee2e2',
		500: '#ef4444',
		600: '#dc2626',
		700: '#b91c1c',
	},
	green: {
		50: '#d1fae5',
		100: '#dcfce7',
		500: '#10b981',
		600: '#059669',
		700: '#047857',
	},
	blue: {
		50: '#eff6ff',
		100: '#dbeafe',
		500: '#3b82f6',
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
	},
	purple: {
		50: '#f3e8ff',
		100: '#e9d5ff',
		500: '#a855f7',
		600: '#9333ea',
		700: '#7e22ce',
	},
	yellow: {
		50: '#fefce8',
		100: '#fef9c3',
		500: '#eab308',
		600: '#ca8a04',
	},
};

// Define common font sizes
export const fontSize = {
	xs: '0.75rem',
	sm: '0.875rem',
	base: '1rem',
	lg: '1.125rem',
	xl: '1.25rem',
	'2xl': '1.5rem',
	'3xl': '1.875rem',
	'4xl': '2.25rem',
	'5xl': '3rem',
};

// Define common font weights
export const fontWeight = {
	normal: '400',
	medium: '500',
	semibold: '600',
	bold: '700',
};

// Define common spacing values
export const spacing = {
	0: '0',
	0.5: '0.125rem',
	1: '0.25rem',
	1.5: '0.375rem',
	2: '0.5rem',
	2.5: '0.625rem',
	3: '0.75rem',
	3.5: '0.875rem',
	4: '1rem',
	5: '1.25rem',
	6: '1.5rem',
	8: '2rem',
	10: '2.5rem',
	12: '3rem',
	16: '4rem',
	20: '5rem',
	24: '6rem',
	32: '8rem',
	40: '10rem',
	48: '12rem',
	56: '14rem',
	64: '16rem',
};

// Define common animations
export const keyframes = {
	spin: `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,
	pulse: `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `,
};

// Define common styles for elements that are reused
export const commonStyles = {
	// Container styles
	container: {
		maxWidth: '1280px',
		margin: '0 auto',
		padding: spacing[4],
	},

	// Card styles
	card: {
		backgroundColor: 'white',
		borderRadius: '0.5rem',
		boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
		overflow: 'hidden',
	},

	// Button styles
	buttonPrimary: {
		backgroundColor: colors.blue[600],
		color: 'white',
		padding: `${spacing[2]} ${spacing[4]}`,
		borderRadius: '0.375rem',
		fontWeight: fontWeight.medium,
		fontSize: fontSize.sm,
		border: 'none',
		cursor: 'pointer',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	buttonSecondary: {
		backgroundColor: colors.gray[100],
		color: colors.gray[800],
		padding: `${spacing[2]} ${spacing[4]}`,
		borderRadius: '0.375rem',
		fontWeight: fontWeight.medium,
		fontSize: fontSize.sm,
		border: 'none',
		cursor: 'pointer',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Heading styles
	heading1: {
		fontSize: fontSize['3xl'],
		fontWeight: fontWeight.bold,
		color: colors.gray[800],
		marginBottom: spacing[4],
	},

	heading2: {
		fontSize: fontSize['2xl'],
		fontWeight: fontWeight.bold,
		color: colors.gray[800],
		marginBottom: spacing[2],
	},

	heading3: {
		fontSize: fontSize.xl,
		fontWeight: fontWeight.semibold,
		color: colors.gray[800],
		marginBottom: spacing[2],
	},

	// Form element styles
	input: {
		width: '100%',
		padding: `${spacing[2]} ${spacing[3]}`,
		border: `1px solid ${colors.gray[300]}`,
		borderRadius: '0.375rem',
		fontSize: fontSize.sm,
	},

	select: {
		width: '100%',
		padding: `${spacing[2]} ${spacing[3]}`,
		border: `1px solid ${colors.gray[300]}`,
		borderRadius: '0.375rem',
		fontSize: fontSize.sm,
	},

	textarea: {
		width: '100%',
		padding: `${spacing[2]} ${spacing[3]}`,
		border: `1px solid ${colors.gray[300]}`,
		borderRadius: '0.375rem',
		fontSize: fontSize.sm,
	},

	// Table styles
	table: {
		width: '100%',
		borderCollapse: 'collapse',
	},

	tableHead: {
		backgroundColor: colors.gray[50],
	},

	tableHeader: {
		padding: `${spacing[3]} ${spacing[6]}`,
		textAlign: 'left',
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		color: colors.gray[500],
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
	},

	tableCell: {
		padding: `${spacing[4]} ${spacing[6]}`,
		borderTop: `1px solid ${colors.gray[200]}`,
	},

	// Link styles
	link: {
		color: colors.blue[600],
		textDecoration: 'none',
	},

	// Loading spinner
	loadingSpinner: {
		animation: 'spin 1s linear infinite',
		border: `2px solid ${colors.gray[200]}`,
		borderTopColor: colors.blue[600],
		borderRadius: '50%',
		height: '2rem',
		width: '2rem',
	},
};

// Helper function to merge style objects
export function mergeStyles(...styles) {
	return Object.assign({}, ...styles);
}

// Helper function to create conditionally applied styles
export function conditionalStyle(condition, style) {
	return condition ? style : {};
}

// Helper function to apply hover styles
export function createHoverProps(hoverStyles) {
	return {
		onMouseEnter: (e) => {
			Object.entries(hoverStyles).forEach(([key, value]) => {
				e.currentTarget.style[key] = value;
			});
		},
		onMouseLeave: (e) => {
			Object.entries(hoverStyles).forEach(([key, value]) => {
				// Reset to original style if we knew it, for now just use defaults
				if (key === 'backgroundColor') e.currentTarget.style[key] = '';
				else if (key === 'color') e.currentTarget.style[key] = '';
				else e.currentTarget.style[key] = '';
			});
		}
	};
}

// Helper for applying media queries through DOM manipulation instead of inline styles
export function applyMediaStyles(elementId, styles, mediaQuery) {
	useEffect(() => {
		const element = document.getElementById(elementId);
		if (!element) return;

		const checkMedia = () => {
			const matches = window.matchMedia(mediaQuery).matches;
			if (matches) {
				Object.entries(styles).forEach(([key, value]) => {
					element.style[key] = value;
				});
			} else {
				// Reset to default styles when media query doesn't match
				Object.keys(styles).forEach(key => {
					element.style[key] = '';
				});
			}
		};

		// Apply initial styles
		checkMedia();

		// Add listener for window resize
		window.addEventListener('resize', checkMedia);

		// Cleanup
		return () => window.removeEventListener('resize', checkMedia);
	}, [elementId, mediaQuery]);
}