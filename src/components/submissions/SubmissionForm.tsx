import { useState } from 'react';
import { CheckSquare, Camera, Check } from 'lucide-react';
import { CameraCapture } from '../camera/CameraCapture';
import type { Chore, ProofSubmission } from '../../types';

interface SubmissionFormProps {
  chore: Chore;
  childName: string;
  instanceId: string;
  isAnytime?: boolean;
  onSubmit: (proof: Omit<ProofSubmission, 'id'>) => void;
  onCancel: () => void;
}

type Step = 'overview' | 'before_photo' | 'checklist' | 'after_photo' | 'review';

export function SubmissionForm({ chore, childName, instanceId, isAnytime, onSubmit, onCancel }: SubmissionFormProps) {
  const [step, setStep] = useState<Step>('overview');
  const [beforePhoto, setBeforePhoto] = useState<string | undefined>();
  const [afterPhoto, setAfterPhoto] = useState<string | undefined>();
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(chore.checklist_items.map(item => [item, false]))
  );

  const needsPhoto = chore.verification_type === 'photo' || chore.verification_type === 'both';
  const needsChecklist = chore.verification_type === 'checklist' || chore.verification_type === 'both';
  const needsBeforeAfter = chore.requires_before_after && needsPhoto;

  const handleStart = () => {
    if (needsBeforeAfter) setStep('before_photo');
    else if (needsChecklist && !needsPhoto) setStep('checklist');
    else if (needsPhoto) setStep('after_photo');
    else setStep('review');
  };

  const handleBeforePhoto = (url: string) => {
    setBeforePhoto(url);
    if (needsChecklist) setStep('checklist');
    else setStep('after_photo');
  };

  const handleAfterPhoto = (url: string) => {
    setAfterPhoto(url);
    setStep('review');
  };

  const handleSinglePhoto = (url: string) => {
    setAfterPhoto(url);
    setStep('review');
  };

  const handleSubmit = () => {
    onSubmit({
      chore_instance_id: instanceId,
      photo_url: afterPhoto,
      before_photo_url: beforePhoto,
      checklist_answers: checklist,
      timestamp: new Date().toISOString(),
    });
  };

  const allChecked = chore.checklist_items.every(item => checklist[item]);

  if (step === 'before_photo') {
    return <CameraCapture label="Before Photo" childName={childName} onCapture={handleBeforePhoto} onCancel={onCancel} />;
  }
  if (step === 'after_photo') {
    return <CameraCapture label={needsBeforeAfter ? 'After Photo' : 'Proof Photo'} childName={childName} onCapture={needsBeforeAfter ? handleAfterPhoto : handleSinglePhoto} onCancel={onCancel} />;
  }
  if (step === 'checklist' && !needsPhoto) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-gray-900">Complete Checklist</h3>
        {chore.checklist_items.map(item => (
          <label key={item} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={checklist[item] || false} onChange={e => setChecklist(prev => ({ ...prev, [item]: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded" />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
        <div className="flex gap-3 mt-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => setStep('review')} disabled={!allChecked} className="btn-primary flex-1">Continue</button>
        </div>
      </div>
    );
  }
  if (step === 'checklist' && needsPhoto) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-gray-900">Complete Checklist</h3>
        {chore.checklist_items.map(item => (
          <label key={item} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={checklist[item] || false} onChange={e => setChecklist(prev => ({ ...prev, [item]: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded" />
            <span className="text-sm text-gray-700">{item}</span>
          </label>
        ))}
        <div className="flex gap-3 mt-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => setStep('after_photo')} disabled={!allChecked} className="btn-primary flex-1">Take Photo</button>
        </div>
      </div>
    );
  }
  if (step === 'review') {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-gray-900">Review & Submit</h3>
        {beforePhoto && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Before</p>
            <img src={beforePhoto} className="w-full rounded-lg" alt="Before" />
          </div>
        )}
        {afterPhoto && (
          <div>
            <p className="text-xs text-gray-500 mb-1">{beforePhoto ? 'After' : 'Proof'}</p>
            <img src={afterPhoto} className="w-full rounded-lg" alt="After" />
          </div>
        )}
        {chore.checklist_items.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Checklist</p>
            {chore.checklist_items.map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700 py-0.5">
                <Check size={14} className={checklist[item] ? 'text-emerald-500' : 'text-gray-300'} />
                {item}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary flex-1">Submit for Review</button>
        </div>
      </div>
    );
  }

  // Overview step
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{chore.title}</h3>
        <p className="text-sm text-gray-600">{chore.description}</p>
        {isAnytime && (
          <p className="text-xs text-purple-600 font-semibold mt-2">⚡ Bonus chore — submit anytime you do this!</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {needsBeforeAfter && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-full">
            <Camera size={12} /> Before + After photos required
          </div>
        )}
        {needsPhoto && !needsBeforeAfter && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-full">
            <Camera size={12} /> Photo required
          </div>
        )}
        {needsChecklist && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-purple-50 px-2 py-1 rounded-full">
            <CheckSquare size={12} /> Checklist required
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleStart} className="btn-primary flex-1">Start</button>
      </div>
    </div>
  );
}
