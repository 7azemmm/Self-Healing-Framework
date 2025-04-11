import numpy as np
from typing import List
import logging

class RLHealingAgent:
    """Reinforcement learning agent for strategy selection."""
    def __init__(self, strategies: List[str]):
        self.strategies = strategies
        self.q_table = np.zeros(len(strategies))
        self.learning_rate = 0.1
        self.discount_factor = 0.9
        self.epsilon = 0.1
        self.logger = logging.getLogger(__name__)

    def choose_strategy(self) -> str:
        """Choose a strategy using epsilon-greedy policy."""
        try:
            if np.random.uniform(0, 1) < self.epsilon:
                return np.random.choice(self.strategies)
            return self.strategies[np.argmax(self.q_table)]
        except Exception as e:
            self.logger.error(f"Error choosing strategy: {str(e)}")
            return self.strategies[0]  # Fallback to first strategy

    def update_q_table(self, strategy: str, reward: float) -> None:
        """Update Q-table based on the reward."""
        try:
            if strategy not in self.strategies:
                self.logger.warning(f"Unknown strategy: {strategy}")
                return
                
            strategy_index = self.strategies.index(strategy)
            self.q_table[strategy_index] += self.learning_rate * (reward - self.q_table[strategy_index])
        except Exception as e:
            self.logger.error(f"Error updating Q-table: {str(e)}")