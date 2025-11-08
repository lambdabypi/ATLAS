import React from 'react';
import { Badge } from './Badge';

export const RAGInfoDisplay = ({ aiAnalysis }) => {
	if (!aiAnalysis?.method && !aiAnalysis?.networkMode) return null;

	const getMethodBadge = (method) => {
		if (method?.includes('rag-primary') || method?.includes('lightweight-rag'))
			return { variant: 'success', text: 'RAG Only' };
		if (method?.includes('rag-ai-enhanced') || method?.includes('hybrid'))
			return { variant: 'primary', text: 'RAG + AI' };
		if (method?.includes('ai-enhanced'))
			return { variant: 'warning', text: 'AI + RAG' };
		if (method?.includes('offline') || method?.includes('rag-fallback'))
			return { variant: 'secondary', text: 'Offline Mode' };
		return { variant: 'outline', text: 'Hybrid' };
	};

	const methodBadge = getMethodBadge(aiAnalysis.method || aiAnalysis.networkMode);

	return (
		<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
			<div className="flex items-center justify-between mb-2">
				<h4 className="text-sm font-medium text-blue-900">Clinical Decision Support</h4>
				<Badge variant={methodBadge.variant} size="sm">
					{methodBadge.text}
				</Badge>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800">
				{aiAnalysis.totalResponseTime && (
					<div>
						<strong>Response Time:</strong> {Math.round(aiAnalysis.totalResponseTime)}ms
					</div>
				)}

				{aiAnalysis.responseTime && !aiAnalysis.totalResponseTime && (
					<div>
						<strong>Response Time:</strong> {Math.round(aiAnalysis.responseTime)}ms
					</div>
				)}

				{aiAnalysis.sources?.length > 0 && (
					<div>
						<strong>Guidelines Used:</strong> {aiAnalysis.sources.join(', ')}
					</div>
				)}

				{aiAnalysis.networkMode && (
					<div>
						<strong>Network Mode:</strong> {aiAnalysis.networkMode.replace('-', ' ')}
					</div>
				)}

				{aiAnalysis.searchStats && (
					<div>
						<strong>Documents Found:</strong> {aiAnalysis.searchStats.documentsFound}
						{aiAnalysis.searchStats.fromCache && ' (cached)'}
					</div>
				)}

				{aiAnalysis.matchScore && (
					<div>
						<strong>Match Score:</strong> {Math.round(aiAnalysis.matchScore * 100)}%
					</div>
				)}
			</div>

			{aiAnalysis.ragBackup && (
				<div className="mt-2 pt-2 border-t border-blue-200">
					<p className="text-xs text-blue-700">
						📋 Offline backup available: {aiAnalysis.ragBackup.sources?.[0] || 'Basic protocols'}
					</p>
				</div>
			)}

			{aiAnalysis.method?.includes('emergency') && (
				<div className="mt-2 pt-2 border-t border-red-200 bg-red-50 p-2 rounded">
					<p className="text-xs text-red-700">
						⚠️ Using emergency fallback protocols - seek connectivity for full analysis
					</p>
				</div>
			)}
		</div>
	);
};