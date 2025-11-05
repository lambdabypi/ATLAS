// lib/sync/crdt-healthcare.js
/**
 * Healthcare-specific CRDT implementation for ATLAS
 * Provides conflict-free replication for patient and consultation data
 */

import { v4 as uuidv4 } from 'uuid';

// CRDT Operation Types
export const CRDT_OPERATIONS = {
	INSERT: 'insert',
	UPDATE: 'update',
	DELETE: 'delete',
	MERGE: 'merge'
};

// Healthcare Data Types that need CRDT synchronization
export const HEALTHCARE_TYPES = {
	PATIENT: 'patient',
	CONSULTATION: 'consultation',
	VITAL_SIGNS: 'vital_signs',
	MEDICATION: 'medication',
	CLINICAL_NOTES: 'clinical_notes'
};

// Vector Clock implementation for causality tracking
export class VectorClock {
	constructor(nodeId) {
		this.nodeId = nodeId;
		this.clock = { [nodeId]: 0 };
	}

	tick() {
		this.clock[this.nodeId]++;
		return this.clock[this.nodeId];
	}

	update(otherClock) {
		for (const [nodeId, timestamp] of Object.entries(otherClock)) {
			this.clock[nodeId] = Math.max(this.clock[nodeId] || 0, timestamp);
		}
		this.tick(); // Increment local clock
	}

	compare(otherClock) {
		const thisKeys = Object.keys(this.clock);
		const otherKeys = Object.keys(otherClock);
		const allKeys = new Set([...thisKeys, ...otherKeys]);

		let thisGreater = false;
		let otherGreater = false;

		for (const key of allKeys) {
			const thisValue = this.clock[key] || 0;
			const otherValue = otherClock[key] || 0;

			if (thisValue > otherValue) thisGreater = true;
			if (otherValue > thisValue) otherGreater = true;
		}

		if (thisGreater && !otherGreater) return 1; // This clock is greater
		if (otherGreater && !thisGreater) return -1; // Other clock is greater
		if (!thisGreater && !otherGreater) return 0; // Equal
		return null; // Concurrent (incomparable)
	}

	clone() {
		const cloned = new VectorClock(this.nodeId);
		cloned.clock = { ...this.clock };
		return cloned;
	}
}

// Healthcare CRDT Document
export class HealthcareCRDT {
	constructor(id, type, nodeId, initialData = {}) {
		this.id = id;
		this.type = type;
		this.nodeId = nodeId;
		this.vectorClock = new VectorClock(nodeId);
		this.operations = [];
		this.state = { ...initialData };
		this.tombstones = new Set(); // For deleted fields
		this.metadata = {
			created: new Date().toISOString(),
			lastModified: new Date().toISOString(),
			version: 1
		};
	}

	// Apply operation to the CRDT
	applyOperation(operation) {
		// Update vector clock with operation's clock
		this.vectorClock.update(operation.vectorClock);

		// Add operation to log if not already present
		const exists = this.operations.find(op =>
			op.id === operation.id &&
			JSON.stringify(op.vectorClock) === JSON.stringify(operation.vectorClock)
		);

		if (!exists) {
			this.operations.push(operation);
			this.operations.sort((a, b) => {
				// Sort by timestamp, then by node ID for deterministic ordering
				const timeCompare = new Date(a.timestamp) - new Date(b.timestamp);
				if (timeCompare !== 0) return timeCompare;
				return a.nodeId.localeCompare(b.nodeId);
			});
		}

		// Recompute state from operations
		this.recomputeState();
	}

	// Create a new operation
	createOperation(type, path, value, metadata = {}) {
		const operation = {
			id: uuidv4(),
			type,
			path,
			value,
			vectorClock: this.vectorClock.clone().clock,
			nodeId: this.nodeId,
			timestamp: new Date().toISOString(),
			metadata: {
				...metadata,
				clinicalContext: this.getClinicalContext(path)
			}
		};

		this.vectorClock.tick();
		this.applyOperation(operation);
		return operation;
	}

	// Get clinical context for field (used for conflict resolution)
	getClinicalContext(path) {
		const clinicalPriorities = {
			'vitalSigns': 'time-sensitive',
			'allergies': 'safety-critical',
			'medications': 'safety-critical',
			'diagnosis': 'clinical-judgment',
			'symptoms': 'subjective-data',
			'examination': 'objective-data',
			'plan': 'treatment-plan'
		};

		const fieldType = path.split('.')[0];
		return clinicalPriorities[fieldType] || 'general';
	}

	// Recompute state from all operations
	recomputeState() {
		const newState = {};

		// Apply operations in chronological order
		for (const operation of this.operations) {
			if (this.tombstones.has(operation.path)) continue;

			switch (operation.type) {
				case CRDT_OPERATIONS.INSERT:
				case CRDT_OPERATIONS.UPDATE:
					this.setNestedValue(newState, operation.path, operation.value);
					break;

				case CRDT_OPERATIONS.DELETE:
					this.tombstones.add(operation.path);
					this.deleteNestedValue(newState, operation.path);
					break;

				case CRDT_OPERATIONS.MERGE:
					this.mergeNestedValue(newState, operation.path, operation.value);
					break;
			}
		}

		this.state = newState;
		this.metadata.lastModified = new Date().toISOString();
		this.metadata.version++;
	}

	// Helper methods for nested object manipulation
	setNestedValue(obj, path, value) {
		const keys = path.split('.');
		let current = obj;

		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) current[keys[i]] = {};
			current = current[keys[i]];
		}

		current[keys[keys.length - 1]] = value;
	}

	deleteNestedValue(obj, path) {
		const keys = path.split('.');
		let current = obj;

		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) return;
			current = current[keys[i]];
		}

		delete current[keys[keys.length - 1]];
	}

	mergeNestedValue(obj, path, value) {
		const keys = path.split('.');
		let current = obj;

		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) current[keys[i]] = {};
			current = current[keys[i]];
		}

		const finalKey = keys[keys.length - 1];
		if (typeof current[finalKey] === 'object' && typeof value === 'object') {
			current[finalKey] = { ...current[finalKey], ...value };
		} else {
			current[finalKey] = value;
		}
	}

	// Merge with another CRDT (for synchronization)
	merge(otherCRDT) {
		if (this.id !== otherCRDT.id || this.type !== otherCRDT.type) {
			throw new Error('Cannot merge CRDTs of different documents');
		}

		const conflicts = [];

		// Merge operations
		for (const operation of otherCRDT.operations) {
			const existingOp = this.operations.find(op => op.id === operation.id);

			if (!existingOp) {
				// New operation - apply it
				this.applyOperation(operation);
			} else if (JSON.stringify(existingOp) !== JSON.stringify(operation)) {
				// Conflict detected - resolve using clinical priorities
				const resolution = this.resolveConflict(existingOp, operation);
				conflicts.push({
					type: 'operation_conflict',
					path: operation.path,
					localValue: existingOp.value,
					remoteValue: operation.value,
					resolution: resolution.winner,
					reason: resolution.reason
				});

				if (resolution.winner === 'remote') {
					this.applyOperation(operation);
				}
			}
		}

		// Update vector clock
		this.vectorClock.update(otherCRDT.vectorClock.clock);

		return {
			merged: true,
			conflicts,
			finalState: this.state
		};
	}

	// Healthcare-specific conflict resolution
	resolveConflict(localOp, remoteOp) {
		const localContext = localOp.metadata?.clinicalContext;
		const remoteContext = remoteOp.metadata?.clinicalContext;

		// Safety-critical data takes precedence
		if (localContext === 'safety-critical' && remoteContext !== 'safety-critical') {
			return { winner: 'local', reason: 'Local operation is safety-critical' };
		}
		if (remoteContext === 'safety-critical' && localContext !== 'safety-critical') {
			return { winner: 'remote', reason: 'Remote operation is safety-critical' };
		}

		// Time-sensitive data - most recent wins
		if (localContext === 'time-sensitive' || remoteContext === 'time-sensitive') {
			const localTime = new Date(localOp.timestamp);
			const remoteTime = new Date(remoteOp.timestamp);

			if (remoteTime > localTime) {
				return { winner: 'remote', reason: 'Remote operation is more recent for time-sensitive data' };
			} else {
				return { winner: 'local', reason: 'Local operation is more recent for time-sensitive data' };
			}
		}

		// Clinical judgment - prefer operations from more senior providers
		if (localContext === 'clinical-judgment' || remoteContext === 'clinical-judgment') {
			const localRole = localOp.metadata?.providerRole || 'unknown';
			const remoteRole = remoteOp.metadata?.providerRole || 'unknown';

			const rolePriority = { 'doctor': 3, 'nurse': 2, 'chw': 1, 'unknown': 0 };

			if (rolePriority[remoteRole] > rolePriority[localRole]) {
				return { winner: 'remote', reason: 'Remote operation from higher-priority role' };
			} else if (rolePriority[localRole] > rolePriority[remoteRole]) {
				return { winner: 'local', reason: 'Local operation from higher-priority role' };
			}
		}

		// Default: most recent timestamp wins
		const localTime = new Date(localOp.timestamp);
		const remoteTime = new Date(remoteOp.timestamp);

		if (remoteTime > localTime) {
			return { winner: 'remote', reason: 'Remote operation is more recent' };
		} else {
			return { winner: 'local', reason: 'Local operation is more recent or equal' };
		}
	}

	// Export for synchronization
	export() {
		return {
			id: this.id,
			type: this.type,
			nodeId: this.nodeId,
			vectorClock: this.vectorClock.clock,
			operations: this.operations,
			state: this.state,
			tombstones: Array.from(this.tombstones),
			metadata: this.metadata
		};
	}

	// Import from synchronization
	static import(data, currentNodeId) {
		const crdt = new HealthcareCRDT(data.id, data.type, currentNodeId);
		crdt.vectorClock.clock = data.vectorClock;
		crdt.operations = data.operations;
		crdt.state = data.state;
		crdt.tombstones = new Set(data.tombstones);
		crdt.metadata = data.metadata;
		return crdt;
	}
}

// CRDT Manager for healthcare data
export class HealthcareCRDTManager {
	constructor(nodeId) {
		this.nodeId = nodeId || this.generateNodeId();
		this.documents = new Map();
		this.syncQueue = [];
		this.conflictLog = [];
	}

	generateNodeId() {
		return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Create new healthcare document
	createDocument(type, id, initialData) {
		if (this.documents.has(id)) {
			throw new Error(`Document ${id} already exists`);
		}

		const crdt = new HealthcareCRDT(id, type, this.nodeId, initialData);
		this.documents.set(id, crdt);

		// Queue for sync
		this.syncQueue.push({
			action: 'create',
			documentId: id,
			timestamp: new Date().toISOString()
		});

		return crdt;
	}

	// Update document
	updateDocument(id, path, value, metadata = {}) {
		const crdt = this.documents.get(id);
		if (!crdt) {
			throw new Error(`Document ${id} not found`);
		}

		const operation = crdt.createOperation(CRDT_OPERATIONS.UPDATE, path, value, metadata);

		// Queue for sync
		this.syncQueue.push({
			action: 'update',
			documentId: id,
			operationId: operation.id,
			timestamp: new Date().toISOString()
		});

		return operation;
	}

	// Merge remote document
	mergeDocument(remoteData) {
		const localCRDT = this.documents.get(remoteData.id);

		if (!localCRDT) {
			// New document from remote
			const crdt = HealthcareCRDT.import(remoteData, this.nodeId);
			this.documents.set(remoteData.id, crdt);
			return { merged: true, conflicts: [] };
		} else {
			// Merge with existing document
			const remoteCRDT = HealthcareCRDT.import(remoteData, this.nodeId);
			const result = localCRDT.merge(remoteCRDT);

			if (result.conflicts.length > 0) {
				this.conflictLog.push({
					documentId: remoteData.id,
					conflicts: result.conflicts,
					timestamp: new Date().toISOString()
				});
			}

			return result;
		}
	}

	// Get all documents for sync
	getAllDocumentsForSync() {
		const docs = [];
		for (const crdt of this.documents.values()) {
			docs.push(crdt.export());
		}
		return docs;
	}

	// Get documents by type
	getDocumentsByType(type) {
		const docs = [];
		for (const crdt of this.documents.values()) {
			if (crdt.type === type) {
				docs.push(crdt.state);
			}
		}
		return docs;
	}

	// Get sync statistics
	getSyncStats() {
		return {
			totalDocuments: this.documents.size,
			queuedSyncs: this.syncQueue.length,
			totalConflicts: this.conflictLog.reduce((sum, log) => sum + log.conflicts.length, 0),
			lastConflict: this.conflictLog.length > 0 ?
				this.conflictLog[this.conflictLog.length - 1].timestamp : null
		};
	}

	// Clear sync queue after successful sync
	clearSyncQueue() {
		this.syncQueue = [];
	}
}

// Healthcare-specific CRDT helpers
export const HealthcareCRDTHelpers = {
	// Create patient CRDT
	createPatient(manager, patientData) {
		const patientId = patientData.id || uuidv4();
		return manager.createDocument(HEALTHCARE_TYPES.PATIENT, patientId, {
			demographics: patientData.demographics || {},
			medicalHistory: patientData.medicalHistory || {},
			allergies: patientData.allergies || [],
			medications: patientData.medications || [],
			contacts: patientData.contacts || []
		});
	},

	// Create consultation CRDT
	createConsultation(manager, consultationData) {
		const consultationId = consultationData.id || uuidv4();
		return manager.createDocument(HEALTHCARE_TYPES.CONSULTATION, consultationId, {
			patientId: consultationData.patientId,
			providerId: consultationData.providerId,
			date: consultationData.date || new Date().toISOString(),
			chiefComplaint: consultationData.chiefComplaint || '',
			symptoms: consultationData.symptoms || {},
			examination: consultationData.examination || {},
			vitalSigns: consultationData.vitalSigns || {},
			diagnosis: consultationData.diagnosis || [],
			plan: consultationData.plan || {},
			notes: consultationData.notes || ''
		});
	},

	// Update vital signs with clinical context
	updateVitalSigns(manager, consultationId, vitalSigns, providerId) {
		return manager.updateDocument(consultationId, 'vitalSigns', vitalSigns, {
			providerId,
			providerRole: 'nurse', // This would come from user context
			clinicalContext: 'time-sensitive',
			timestamp: new Date().toISOString()
		});
	},

	// Update diagnosis with clinical judgment context
	updateDiagnosis(manager, consultationId, diagnosis, providerId, providerRole) {
		return manager.updateDocument(consultationId, 'diagnosis', diagnosis, {
			providerId,
			providerRole,
			clinicalContext: 'clinical-judgment',
			requiresVerification: providerRole !== 'doctor',
			timestamp: new Date().toISOString()
		});
	}
};