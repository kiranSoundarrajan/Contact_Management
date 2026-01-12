import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { contactSchema } from '../../utils/validationSchemas';
import { ContactFormData } from '../../types/contact.types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  isLoading?: boolean;
  initialData?: ContactFormData;
  onCancel?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      place: '',
      dob: '',
    },
    mode: 'onChange',
  });

  const handleFormSubmit = (data: ContactFormData) => {
    onSubmit(data);
    if (!initialData) {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Full Name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            placeholder="John Doe"
            required
          />
        </div>
        
        <div>
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="john@example.com"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Place"
            type="text"
            {...register('place')}
            error={errors.place?.message}
            placeholder="City, Country"
            required
          />
        </div>
        
        <div>
          <Input
            label="Date of Birth"
            type="date"
            {...register('dob')}
            error={errors.dob?.message}
            required
          />
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          isLoading={isLoading}
          className="flex-1"
          disabled={!isValid || isLoading}
        >
          {initialData ? 'Update Contact' : 'Add Contact'}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default ContactForm;