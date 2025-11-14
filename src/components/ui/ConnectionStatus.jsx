// src/components/ui/ConnectionStatus.jsx - REUSABLE CONNECTION STATUS COMPONENT
'use client';

import { useOnlineStatus } from '../../lib/hooks/useOnlineStatus';
import { Badge } from './Badge';

export default function ConnectionStatus({
	variant = 'full', // 'full', 'compact', 'icon-only', 'banner'
	showLastCheck = false,
	className = '',
	onClick = null
}) {
	const { isOnline, getStatusInfo, checkConnectivity } = useOnlineStatus();
	const statusInfo = getStatusInfo();

	const handleClick = async () => {
		if (onClick) {
			onClick();
		} else if (!isOnline) {
			// Try to check connectivity when clicked while offline
			await checkConnectivity();
		}
	};

	// Icon-only variant
	if (variant === 'icon-only') {
		return (
			<div
				className={`inline-flex items-center ${onClick || !isOnline ? 'cursor-pointer' : ''} ${className}`}
				onClick={handleClick}
				title={statusInfo.statusText}
			>
				<span className="text-lg">{statusInfo.statusIcon}</span>
			</div>
		);
	}

	// Compact variant
	if (variant === 'compact') {
		return (
			<div
				className={`inline-flex items-center space-x-2 ${onClick || !isOnline ? 'cursor-pointer' : ''} ${className}`}
				onClick={handleClick}
			>
				<span>{statusInfo.statusIcon}</span>
				<Badge
					variant={
						statusInfo.statusColor === 'green' ? 'success' :
							statusInfo.statusColor === 'yellow' ? 'warning' : 'error'
					}
					size="sm"
				>
					{statusInfo.statusText}
				</Badge>
			</div>
		);
	}

	// Banner variant
	if (variant === 'banner') {
		if (isOnline && !statusInfo.isSlowConnection) {
			return null; // Don't show banner when everything is good
		}

		const bannerClass = !isOnline
			? 'bg-red-50 border-red-200 text-red-800'
			: 'bg-yellow-50 border-yellow-200 text-yellow-800';

		return (
			<div className={`border rounded-lg p-4 mb-6 ${bannerClass} ${className}`}>
				<div className="flex items-start">
					<span className="mr-3 text-lg">{statusInfo.statusIcon}</span>
					<div className="flex-1">
						<h4 className="font-medium">
							{!isOnline ? 'Working Offline' : 'Slow Connection'}
						</h4>
						<p className="text-sm mt-1">
							{!isOnline
								? 'You\'re currently offline. Data will be saved locally and synced when connection is restored.'
								: 'Your connection is slower than usual. Some features may take longer to load.'
							}
						</p>
						{showLastCheck && statusInfo.lastConnectivityCheck && (
							<p className="text-xs mt-2 opacity-75">
								Last connectivity check: {new Date(statusInfo.lastConnectivityCheck).toLocaleTimeString()}
							</p>
						)}
					</div>
					{!isOnline && (
						<button
							onClick={handleClick}
							className="ml-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
						>
							Retry
						</button>
					)}
				</div>
			</div>
		);
	}

	// Full variant (default)
	return (
		<div
			className={`inline-flex items-center space-x-3 px-4 py-2 rounded-lg border transition-colors ${statusInfo.statusColor === 'green'
					? 'bg-green-50 border-green-200 text-green-800'
					: statusInfo.statusColor === 'yellow'
						? 'bg-yellow-50 border-yellow-200 text-yellow-800'
						: 'bg-red-50 border-red-200 text-red-800'
				} ${onClick || !isOnline ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
			onClick={handleClick}
		>
			<div className={`w-2 h-2 rounded-full ${statusInfo.statusColor === 'green' ? 'bg-green-500' :
					statusInfo.statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
				} ${!isOnline ? 'animate-pulse' : ''}`} />

			<div className="flex-1">
				<div className="flex items-center space-x-2">
					<span className="text-sm font-medium">{statusInfo.statusText}</span>
					{statusInfo.isSlowConnection && (
						<Badge variant="warning" size="sm">Slow</Badge>
					)}
				</div>

				{showLastCheck && statusInfo.lastConnectivityCheck && (
					<p className="text-xs opacity-75 mt-1">
						Last check: {new Date(statusInfo.lastConnectivityCheck).toLocaleTimeString()}
					</p>
				)}
			</div>

			{!isOnline && (
				<div className="text-xs font-medium opacity-75">
					Click to retry
				</div>
			)}
		</div>
	);
}

// Named exports for convenience
export const ConnectionStatusIcon = (props) => <ConnectionStatus variant="icon-only" {...props} />;
export const ConnectionStatusCompact = (props) => <ConnectionStatus variant="compact" {...props} />;
export const ConnectionStatusBanner = (props) => <ConnectionStatus variant="banner" {...props} />;
export const ConnectionStatusFull = (props) => <ConnectionStatus variant="full" {...props} />;