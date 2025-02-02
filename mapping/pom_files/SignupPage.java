import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

import java.time.Duration;

public class LoginPage {
    @FindBy(id = "email")
    WebElement emailInput;
    
    @FindBy(id = "password")
    WebElement passwordInput;
    
    @FindBy(id = "signup-button")
    WebElement signupButton;
    
    private WebDriver driver;

    public signupPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public void navigateTosignupPage() {
        driver.get("https://market/signup");
        // Add wait for page load if needed
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.visibilityOf(emailInput));
    }
    
    public void enterUsername(String username) {
        emailInput.clear();
        emailInput.sendKeys(username);
    }
    
    public void enterPassword(String password) {
        passwordInput.clear();
        passwordInput.sendKeys(password);
    }
    
    public void clicksignupButton() {
        signupButton.click();
    }
    
  
}