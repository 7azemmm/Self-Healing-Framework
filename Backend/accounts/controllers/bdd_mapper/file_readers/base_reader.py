from abc import ABC, abstractmethod

class IFileReader(ABC):
    """Abstract base class for file readers"""
    @abstractmethod
    def read(self, content):
        """Read and parse file content"""
        pass