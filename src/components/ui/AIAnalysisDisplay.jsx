import React from 'react';
import { Badge } from './Badge';

export const AIAnalysisDisplay = ({ analysis }) => {
	if (!analysis) return null;

	return (
		<div className="space-y-3">
			{/* Confidence and Method Info */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Badge variant={
						analysis.confidence === 'high' ? 'success' :
							analysis.confidence === 'medium' ? 'warning' :
								'secondary'
					}>
						{analysis.confidence} Confidence
					</Badge>

					{analysis.method && (
						<Badge variant="outline" size="sm">
							{analysis.method.replace(/-/g, ' ')}
						</Badge>
					)}

					{analysis.isRuleBased && (
						<Badge variant="secondary" size="sm">Rule-based</Badge>
					)}
				</div>

				{analysis.responseTime && (
					<span className="text-xs text-gray-500">
						{Math.round(analysis.responseTime)}ms
					</span>
				)}
			</div>

			{/* Main Analysis Text */}
			<div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
				<div className="whitespace-pre-wrap text-sm leading-relaxed">
					{analysis.text}
				</div>
			</div>

			{/* Sources */}
			{analysis.sources && analysis.sources.length > 0 && (
				<div className="text-xs text-gray-600">
					<strong>Sources:</strong> {analysis.sources.join(', ')}
				</div>
			)}

			{/* Error Display */}
			{analysis.error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-800">
						Error: {analysis.error}
					</p>
				</div>
			)}
		</div>
	);
};