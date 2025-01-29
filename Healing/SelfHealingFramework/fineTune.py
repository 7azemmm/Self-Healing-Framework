from sentence_transformers import SentenceTransformer, InputExample
from torch.utils.data import DataLoader
from sentence_transformers import losses
import pandas as pd

def prepare_training_data(dataset):
    # Convert dataset rows into InputExample objects
    train_examples = []
    for row in dataset:
        try:
            broken_element = str(row['Broken Element'])
            page_context = str(row['Page Context'])
            
            # Ensure that 'Candidate Elements' is a valid string before splitting
            candidates = row['Candidate Elements']
            
            # Check for NaN or invalid values in 'Candidate Elements' and skip or handle them
            if isinstance(candidates, str):
                candidates = candidates.split(', ')
            else:
                continue  # Skip this row if candidates are invalid
            
            correct_replacement = str(row['Correct Replacement'])
            
            # Handle Label conversion with validation
            try:
                # Check if Label is NaN
                if pd.isna(row['Label']):
                    continue
                label = int(float(row['Label']))  # Convert float to int
                if label not in [0, 1]:  # Validate label values
                    continue
            except (ValueError, TypeError):
                continue  # Skip rows with invalid labels
            
            # Create positive/negative examples based on label
            for candidate in candidates:
                # Combine broken element and page context as anchor text
                anchor = f"{broken_element} {page_context}"
                train_examples.append(InputExample(
                    texts=[anchor, candidate],
                    label=1 if candidate == correct_replacement else 0
                ))
                
        except KeyError as e:
            print(f"Missing required column: {e}")
            continue
        except Exception as e:
            print(f"Error processing row: {e}")
            continue
    
    if not train_examples:
        raise ValueError("No valid training examples could be created from the dataset")
        
    return train_examples

def fine_tune_model(train_examples, model_name='all-MiniLM-L6-v2', epochs=3):
    # Initialize the SBERT model
    model = SentenceTransformer(model_name)
    
    # Create data loader
    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
    
    # Use ContrastiveLoss instead of SoftmaxLoss
    train_loss = losses.ContrastiveLoss(model=model)
    
    # Train the model
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=epochs,
        warmup_steps=100,
        show_progress_bar=True
    )
    
    return model

def main():
    # Load dataset from Excel file
    dataset_path = 'C:\\Users\\hp\\Desktop\\healing-dataset.xlsx'
    dataset = pd.read_excel(dataset_path)
    
    # Convert DataFrame to list of dictionaries
    dataset_dict = dataset.to_dict('records')
    
    # Prepare training examples
    train_examples = prepare_training_data(dataset_dict)
    
    # Fine-tune the model
    model = fine_tune_model(train_examples)
    
    # Save the fine-tuned model
    model.save('fine_tuned_model')

if __name__ == "__main__":
    main()
